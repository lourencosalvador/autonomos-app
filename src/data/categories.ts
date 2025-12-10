import {
  BookOpen,
  Dumbbell,
  HeartPulse,
  Home,
  Laptop,
  LucideIcon,
  MoreHorizontal,
  Palette,
  Scissors,
  Sparkles,
  Wine,
} from 'lucide-react-native';

export type Category = {
  id: string;
  name: string;
  Icon: LucideIcon;
  stroke: number;
};
export const categories: Category[] = [
  { id: 'casa',        name: 'Casa',        Icon: Home,        stroke: 2 },
  { id: 'beleza',      name: 'Beleza',      Icon: Sparkles,    stroke: 1.9 },
  { id: 'decoracao',   name: 'Decoração',   Icon: Palette,     stroke: 2 },
  { id: 'cocktail',    name: 'Cocktail',    Icon: Wine,        stroke: 2 },
  { id: 'cabeleireiro',name: 'Cabeleireiro',Icon: Scissors,    stroke: 2 },
  { id: 'fitness',     name: 'Fitness',     Icon: Dumbbell,    stroke: 2 },
  { id: 'tecnologia',  name: 'Tecnologia',  Icon: Laptop,      stroke: 2 },
  { id: 'educacao',    name: 'Educação',    Icon: BookOpen,    stroke: 2 },
  { id: 'saude',       name: 'Saúde',       Icon: HeartPulse,  stroke: 2 },
  { id: 'outros',      name: 'Outros',      Icon: MoreHorizontal, stroke: 2.2 },
] as const;