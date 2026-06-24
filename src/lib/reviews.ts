/**
 * Deriva a nota (1–5) que o prestador dá ao cliente a partir das duas perguntas:
 *  - educado (polite): sim = bom
 *  - mudou o escopo (changedScope): não = bom
 *
 * Começa em 5 e tira 2 por cada sinal negativo → resulta em 5 / 3 / 1.
 */
export function computeClientRating(polite: boolean, changedScope: boolean): 1 | 2 | 3 | 4 | 5 {
  let r = 5;
  if (!polite) r -= 2;
  if (changedScope) r -= 2;
  return Math.max(1, r) as 1 | 2 | 3 | 4 | 5;
}

/** Média de notas (para exibir estrelas de perfil). */
export function averageRating(ratings: number[]): { avg: number; count: number } {
  const list = (ratings || []).filter((n) => Number.isFinite(n));
  const count = list.length;
  const sum = list.reduce((acc, n) => acc + Number(n || 0), 0);
  return { avg: count ? sum / count : 0, count };
}
