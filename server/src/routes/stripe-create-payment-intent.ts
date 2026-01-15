import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { isStripeConfigured, stripe, stripeMode } from '../lib/stripe.js';
import { isSupabaseAdminConfigured, supabaseAdmin } from '../lib/supabaseAdmin.js';

function badRequest(res: Response, message: string) {
  return res.status(400).json({ ok: false, message });
}

async function isConnectDestinationReady(accountId: string): Promise<boolean> {
  if (!stripe) return false;
  if (!accountId) return false;
  try {
    const acct = await stripe.accounts.retrieve(accountId);
    const caps: any = (acct as any)?.capabilities || {};
    const transfers = String(caps?.transfers || '').toLowerCase(); // 'active' | 'pending' | 'inactive'
    // Para destination charges precisamos que transfers esteja ativo (senão a Stripe bloqueia).
    return transfers === 'active';
  } catch {
    return false;
  }
}

export async function stripeCreatePaymentIntentRoute(req: Request, res: Response) {
  try {
    if (!isStripeConfigured || !stripe) return res.status(500).json({ ok: false, message: 'Stripe não configurado no servidor.' });
    if (!isSupabaseAdminConfigured || !supabaseAdmin) return res.status(500).json({ ok: false, message: 'Supabase Admin não configurado no servidor.' });

    const requestId = String((req.body as any)?.requestId || '').trim();
    const clientId = String((req.body as any)?.clientId || '').trim(); // opcional (ajuda a validar)

    if (!requestId) return badRequest(res, 'requestId é obrigatório.');

    const { data: requestRow, error: reqErr } = await supabaseAdmin
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();
    if (reqErr) throw reqErr;
    if (!requestRow) return res.status(404).json({ ok: false, message: 'Pedido não encontrado.' });

    // Regras de negócio mínimas
    if (clientId && String((requestRow as any).client_id) !== clientId) {
      return res.status(403).json({ ok: false, message: 'Este pedido não pertence a este cliente.' });
    }
    if (String((requestRow as any).status) !== 'accepted') {
      return badRequest(res, 'Pagamento só é permitido quando o pedido estiver ACEITE.');
    }

    const amount = Number((requestRow as any).price_amount ?? 0);
    let currency = String((requestRow as any).currency || 'usd').trim().toLowerCase();
    if (!currency) currency = 'usd';

    // Stripe: AOA (Kwanza) pode não ter métodos de pagamento ativos/suportados em algumas contas.
    // Para não travar o teste, fazemos fallback para USD e guardamos a moeda original no metadata.
    const originalCurrency = currency;
    if (currency === 'aoa' || currency === 'kz' || currency === 'kwanza') currency = 'usd';

    if (!Number.isFinite(amount) || amount <= 0) {
      return badRequest(res, 'O prestador ainda não definiu o preço.');
    }

    // Se já existir um PaymentIntent para este pedido, reutilizamos quando for seguro.
    const existingIntentId = String((requestRow as any).stripe_payment_intent_id || '').trim();
    if (existingIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(existingIntentId);
        const shouldReuse =
          // Não reutiliza se o PI já terminou
          pi.status !== 'succeeded' &&
          pi.status !== 'canceled' &&
          // Não reutiliza se mudou valor/moeda
          pi.amount === amount &&
          pi.currency === currency;

        if (shouldReuse) {
          return res.json({
            ok: true,
            paymentIntentClientSecret: pi.client_secret,
            paymentIntentId: pi.id,
            stripeMode,
            livemode: pi.livemode,
          });
        }
        // Caso contrário, criaremos um novo PI abaixo e sobrescreveremos no Supabase.
      } catch (e: any) {
        // Se trocarmos de chaves (LIVE -> TEST) ou o PI tiver sido apagado, a Stripe retorna resource_missing.
        // Nesse caso, criamos um novo PI e sobrescrevemos no Supabase.
        const msg = String(e?.message || '');
        const code = String(e?.code || '');
        if (code === 'resource_missing' || msg.includes('No such payment_intent')) {
          // segue fluxo para criar um novo PI abaixo
        } else {
          throw e;
        }
      }
    }

    // Connect (opcional): se o prestador tiver conta conectada, podemos direcionar o pagamento.
    const providerId = String((requestRow as any).provider_id);
    const { data: providerProfile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', providerId)
      .maybeSingle();

    const destination = String((providerProfile as any)?.stripe_account_id || '').trim();

    const baseParams: Stripe.PaymentIntentCreateParams = {
      amount,
      currency,
      // Evita o erro "No valid payment method types..." quando o Dashboard não tem métodos
      // automáticos ativados/compatíveis. Para o nosso app, cartão resolve o teste.
      payment_method_types: ['card'],
      metadata: {
        request_id: requestId,
        client_id: String((requestRow as any).client_id),
        provider_id: providerId,
        original_currency: originalCurrency,
      },
    };

    // Connect (destination charge) é opcional e pode falhar se o prestador ainda não ativou recebimentos
    // (capability transfers / feature stripe_transfers). Para não travar o pagamento do cliente,
    // fazemos fallback automático para pagamento na conta da plataforma e registramos no "wallet" interno.
    let pi: Stripe.PaymentIntent;
    let connectAttempted = false;
    let connectUsed = false;
    let connectReason: string | undefined;

    // Só tenta Connect se a conta conectada estiver realmente pronta para transfers.
    const destinationReady = destination ? await isConnectDestinationReady(destination) : false;

    if (destination && destinationReady) {
      connectAttempted = true;
      try {
        pi = await stripe.paymentIntents.create({
          ...baseParams,
          transfer_data: { destination },
          // Fee do app (exemplo): 10%. Ajuste depois.
          application_fee_amount: Math.max(1, Math.round(amount * 0.1)),
        });
        connectUsed = true;
      } catch (e: any) {
        const msg = String(e?.message || '');
        const code = String(e?.code || '');
        // Erros comuns quando a conta conectada ainda não está apta a receber transfers
        const needsTransfers =
          msg.includes('stripe_balance.stripe_transfers') ||
          msg.toLowerCase().includes('destination account') ||
          (msg.toLowerCase().includes('transfers') && msg.toLowerCase().includes('enabled')) ||
          code === 'account_invalid';

        if (!needsTransfers) throw e;

        connectReason = 'destination_not_eligible_for_transfers';
        // Fallback: cria PaymentIntent SEM destination (plataforma recebe; wallet interno reflete o valor)
        pi = await stripe.paymentIntents.create({
          ...baseParams,
          metadata: {
            ...(baseParams.metadata || {}),
            connect_destination: destination,
            connect_fallback: 'true',
            connect_reason: connectReason,
          },
        });
      }
    } else if (destination && !destinationReady) {
      // Prestador iniciou onboarding mas ainda não está pronto: não bloqueia o pagamento do cliente.
      connectAttempted = true;
      connectUsed = false;
      connectReason = 'connect_onboarding_incomplete';
      pi = await stripe.paymentIntents.create({
        ...baseParams,
        metadata: {
          ...(baseParams.metadata || {}),
          connect_destination: destination,
          connect_fallback: 'true',
          connect_reason: connectReason,
        },
      });
    } else {
      pi = await stripe.paymentIntents.create(baseParams);
    }

    // Persistimos o PI no pedido e criamos (ou atualizamos) o registro de pagamento
    await supabaseAdmin.from('requests').update({ stripe_payment_intent_id: pi.id, payment_status: pi.status }).eq('id', requestId);

    await supabaseAdmin.from('payments').upsert(
      {
        request_id: requestId,
        client_id: String((requestRow as any).client_id),
        provider_id: providerId,
        amount,
        currency,
        status: pi.status,
        stripe_payment_intent_id: pi.id,
      } as any,
      { onConflict: 'stripe_payment_intent_id' }
    );

    return res.json({
      ok: true,
      paymentIntentClientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      stripeMode,
      livemode: pi.livemode,
      connect: destination
        ? {
            attempted: connectAttempted,
            used: connectUsed,
            destination,
            reason: connectUsed ? undefined : connectReason,
          }
        : { attempted: false, used: false },
    });
  } catch (e: any) {
    console.error('[stripe/payment-intent]', e);
    // Supabase: chave inválida costuma vir com hint
    if (e?.message === 'Invalid API key') {
      return res.status(500).json({
        ok: false,
        message: 'SUPABASE_SERVICE_ROLE_KEY inválida no servidor. Verifique a service role key no Supabase Dashboard.',
      });
    }
    // Stripe: moeda sem métodos válidos
    if (String(e?.message || '').includes('No valid payment method types')) {
      return res.status(400).json({
        ok: false,
        message:
          'Sem métodos de pagamento válidos para esta moeda na Stripe. Para testes, use USD (ou ative métodos compatíveis no Dashboard).',
      });
    }
    return res.status(500).json({ ok: false, message: e?.message || 'Erro ao criar PaymentIntent.' });
  }
}


