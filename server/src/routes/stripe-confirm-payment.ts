import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { isStripeConfigured, stripe } from '../lib/stripe.js';
import { isSupabaseAdminConfigured, supabaseAdmin } from '../lib/supabaseAdmin.js';

function badRequest(res: Response, message: string) {
  return res.status(400).json({ ok: false, message });
}

export async function stripeConfirmPaymentRoute(req: Request, res: Response) {
  try {
    if (!isStripeConfigured || !stripe) return res.status(500).json({ ok: false, message: 'Stripe não configurado no servidor.' });
    if (!isSupabaseAdminConfigured || !supabaseAdmin) return res.status(500).json({ ok: false, message: 'Supabase Admin não configurado no servidor.' });

    const paymentIntentId = String((req.body as any)?.paymentIntentId || '').trim();
    const requestId = String((req.body as any)?.requestId || '').trim();
    if (!paymentIntentId) return badRequest(res, 'paymentIntentId é obrigatório.');
    if (!requestId) return badRequest(res, 'requestId é obrigatório.');

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const metaReqId = String((pi.metadata as any)?.request_id || '').trim();
    if (metaReqId && metaReqId !== requestId) {
      return res.status(403).json({ ok: false, message: 'PaymentIntent não pertence a este pedido.' });
    }

    const status = pi.status;

    // Upsert payment row
    await supabaseAdmin.from('payments').upsert(
      {
        request_id: requestId,
        client_id: String((pi.metadata as any)?.client_id || '') || null,
        provider_id: String((pi.metadata as any)?.provider_id || '') || null,
        amount: pi.amount,
        currency: pi.currency,
        status,
        stripe_payment_intent_id: pi.id,
        paid_at: status === 'succeeded' ? new Date().toISOString() : null,
      } as any,
      { onConflict: 'stripe_payment_intent_id' }
    );

    const patch: any = {
      payment_status: status,
      paid_at: status === 'succeeded' ? new Date().toISOString() : null,
      stripe_payment_intent_id: pi.id,
    };
    if (status === 'succeeded') patch.status = 'completed';

    const { error } = await supabaseAdmin.from('requests').update(patch).eq('id', requestId);
    if (error) {
      // fallback (não quebra)
      await supabaseAdmin
        .from('requests')
        .update({
          payment_status: status,
          paid_at: status === 'succeeded' ? new Date().toISOString() : null,
          stripe_payment_intent_id: pi.id,
        } as any)
        .eq('id', requestId);
    }

    return res.json({ ok: true, status, livemode: (pi as Stripe.PaymentIntent).livemode });
  } catch (e: any) {
    console.error('[stripe/confirm]', e);
    return res.status(500).json({ ok: false, message: e?.message || 'Erro ao confirmar pagamento.' });
  }
}


