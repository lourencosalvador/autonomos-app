import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { isStripeConfigured, stripe } from '../lib/stripe.js';
import { isSupabaseAdminConfigured, supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function stripeWebhookRoute(req: Request, res: Response) {
  try {
    if (!isStripeConfigured || !stripe) return res.status(500).send('stripe_not_configured');
    if (!isSupabaseAdminConfigured || !supabaseAdmin) return res.status(500).send('supabase_admin_not_configured');

    const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const sig = req.headers['stripe-signature'];
    if (!secret) return res.status(500).send('missing_webhook_secret');
    if (!sig || typeof sig !== 'string') return res.status(400).send('missing_signature');

    const rawBody = req.body as Buffer;
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (err: any) {
      console.error('[stripe/webhook] signature', err?.message);
      return res.status(400).send(`webhook_signature_error`);
    }

    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled' || event.type === 'payment_intent.processing') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const requestId = String((pi.metadata as any)?.request_id || '').trim();
      const status = pi.status;

      // Upsert payment row (se a tabela existir)
      try {
        await supabaseAdmin.from('payments').upsert(
          {
            request_id: requestId || null,
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
      } catch (e: any) {
        console.error('[stripe/webhook] payments_upsert_failed', e?.message || e);
      }

      // Atualiza o pedido (se tiver request_id)
      if (requestId) {
        const patch: any = {
          payment_status: status,
          paid_at: status === 'succeeded' ? new Date().toISOString() : null,
          stripe_payment_intent_id: pi.id,
        };

        // Regra do app: pagou => serviço concluído
        if (status === 'succeeded') patch.status = 'completed';

        const { error } = await supabaseAdmin.from('requests').update(patch).eq('id', requestId);

        // Se a coluna/constraint ainda não suportar 'completed', não derruba o webhook — mantém pelo menos payment_status.
        if (error) {
          console.error('[stripe/webhook] request_update_failed', error?.message || error);
          if (status === 'succeeded') {
            await supabaseAdmin
              .from('requests')
              .update({
                payment_status: status,
                paid_at: new Date().toISOString(),
                stripe_payment_intent_id: pi.id,
              } as any)
              .eq('id', requestId);
          }
        }
      }
    }

    return res.json({ received: true });
  } catch (e: any) {
    console.error('[stripe/webhook]', e);
    return res.status(500).send('webhook_error');
  }
}


