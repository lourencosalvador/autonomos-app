import type { Request, Response } from 'express';
import { isSupabaseAdminConfigured, supabaseAdmin } from '../lib/supabaseAdmin.js';

function badRequest(res: Response, message: string) {
  return res.status(400).json({ ok: false, message });
}

const HOUR = 60 * 60 * 1000;

/**
 * Solicitação de saque (FlexPay) pelo prestador.
 * Calcula o saldo DISPONÍVEL (líquido liberado − saques já feitos), valida o valor
 * e cria um saque com estado 'processing' e previsão de chegada em 24h–48h.
 */
export async function withdrawalRequestRoute(req: Request, res: Response) {
  try {
    if (!isSupabaseAdminConfigured || !supabaseAdmin) {
      return res.status(500).json({ ok: false, message: 'Supabase Admin não configurado no servidor.' });
    }

    const providerId = String((req.body as any)?.providerId || '').trim();
    const requestedAmount = Number((req.body as any)?.amount ?? 0); // minor units; 0/ausente = sacar tudo
    if (!providerId) return badRequest(res, 'providerId é obrigatório.');

    // Pagamentos liberados (sacáveis)
    const { data: pays, error: payErr } = await supabaseAdmin
      .from('payments')
      .select('amount, provider_net, currency, status, escrow_status')
      .eq('provider_id', providerId)
      .eq('status', 'succeeded');
    if (payErr) throw payErr;

    const released = (pays || []).filter((p: any) => p.escrow_status === 'released');
    const releasedTotal = released.reduce(
      (sum: number, p: any) => sum + Number(p.provider_net ?? p.amount ?? 0),
      0
    );
    const currency = String((released.find((p: any) => p.currency)?.currency || pays?.find((p: any) => p.currency)?.currency || 'usd')).toLowerCase();

    // Saques já existentes (não falhados) descontam do disponível
    const { data: withs, error: wErr } = await supabaseAdmin
      .from('withdrawals')
      .select('amount, status')
      .eq('provider_id', providerId);
    if (wErr) throw wErr;
    const committed = (withs || [])
      .filter((w: any) => w.status === 'processing' || w.status === 'paid')
      .reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);

    const available = Math.max(0, releasedTotal - committed);
    if (available <= 0) {
      return badRequest(res, 'Você ainda não tem saldo disponível para saque.');
    }

    let amount = requestedAmount > 0 ? Math.round(requestedAmount) : available;
    if (amount > available) {
      return badRequest(res, 'Valor solicitado maior que o saldo disponível.');
    }

    const now = Date.now();
    const requestedAt = new Date(now).toISOString();
    // Previsão: entre 24h e 48h
    const estimatedArrival = new Date(now + 48 * HOUR).toISOString();

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        provider_id: providerId,
        amount,
        currency,
        status: 'processing',
        method: 'flex_pay',
        requested_at: requestedAt,
        estimated_arrival: estimatedArrival,
      } as any)
      .select('*')
      .maybeSingle();
    if (insErr) throw insErr;

    return res.json({
      ok: true,
      withdrawal: inserted,
      amount,
      currency,
      available: available - amount,
      estimatedArrival,
      etaHoursMin: 24,
      etaHoursMax: 48,
    });
  } catch (e: any) {
    console.error('[withdrawals/request]', e);
    return res.status(500).json({ ok: false, message: e?.message || 'Erro ao solicitar saque.' });
  }
}
