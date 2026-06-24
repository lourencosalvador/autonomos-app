export type Availability = { days: number[]; start: string; end: string };

// 1=Seg ... 7=Dom
export const WEEK_DAYS = [
  { n: 1, short: 'Seg', long: 'segunda' },
  { n: 2, short: 'Ter', long: 'terça' },
  { n: 3, short: 'Qua', long: 'quarta' },
  { n: 4, short: 'Qui', long: 'quinta' },
  { n: 5, short: 'Sex', long: 'sexta' },
  { n: 6, short: 'Sáb', long: 'sábado' },
  { n: 7, short: 'Dom', long: 'domingo' },
];

function longLabel(n: number) {
  return WEEK_DAYS.find((d) => d.n === n)?.long || '';
}
function shortLabel(n: number) {
  return WEEK_DAYS.find((d) => d.n === n)?.short || '';
}

function isContiguous(sorted: number[]) {
  if (sorted.length < 2) return true;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) return false;
  }
  return true;
}

/** "De segunda a sábado · das 08:00 às 20:00" */
export function formatAvailability(av: Availability | null | undefined): string {
  if (!av || !Array.isArray(av.days) || av.days.length === 0) return 'Horário não definido';
  const days = [...new Set(av.days)].sort((a, b) => a - b);
  let daysText: string;
  if (days.length === 7) {
    daysText = 'Todos os dias';
  } else if (days.length >= 2 && isContiguous(days)) {
    daysText = `De ${longLabel(days[0])} a ${longLabel(days[days.length - 1])}`;
  } else {
    daysText = days.map(shortLabel).join(', ');
  }
  const time = av.start && av.end ? ` · das ${av.start} às ${av.end}` : '';
  return `${daysText}${time}`;
}
