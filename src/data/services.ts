export type ServiceCategoryId =
    | 'casa'
    | 'beleza'
    | 'decoracao'
    | 'cocktail'
    | 'cabeleireiro'
    | 'fitness'
    | 'tecnologia'
    | 'educacao'
    | 'saude'
    | 'outros';

export type Service = {
    id: string;
    name: string;
    description: string;
    image: any;
    category: ServiceCategoryId;
    /** Valor inicial do serviço em Kwanzas (Kz). */
    priceFrom: number;
};

// Imagens do Unsplash escolhidas para corresponder a cada serviço (não aleatórias).
const u = (id: string) => ({ uri: `https://images.unsplash.com/photo-${id}?w=600&h=400&fit=crop&q=80&auto=format` });

export const services: Service[] = [
    // ---- Casa ----
    {
        id: '1',
        name: 'Pintura',
        description: 'Pintura de interiores e exteriores com acabamento profissional.',
        image: u('1688372199140-cade7ae820fe'),
        category: 'casa',
        priceFrom: 20000,
    },
    {
        id: '2',
        name: 'Canalização',
        description: 'Reparação de fugas, instalação de torneiras e sistemas de água.',
        image: u('1676210134188-4c05dd172f89'),
        category: 'casa',
        priceFrom: 15000,
    },
    {
        id: '3',
        name: 'Eletricista',
        description: 'Instalações elétricas, tomadas e reparações feitas com segurança.',
        image: u('1621905251189-08b45d6a269e'),
        category: 'casa',
        priceFrom: 12000,
    },
    {
        id: '4',
        name: 'Limpeza',
        description: 'Limpeza profunda de residências e escritórios, do seu jeito.',
        image: u('1740657254989-42fe9c3b8cce'),
        category: 'casa',
        priceFrom: 8000,
    },

    // ---- Beleza ----
    {
        id: '5',
        name: 'Make Up',
        description: 'Maquilhagem para eventos, casamentos e sessões fotográficas.',
        image: u('1622336889416-8d790ad807d7'),
        category: 'beleza',
        priceFrom: 10000,
    },
    {
        id: '6',
        name: 'Manicure & Pedicure',
        description: 'Cuidado completo de unhas com esmaltagem comum e em gel.',
        image: u('1632345031435-8727f6897d53'),
        category: 'beleza',
        priceFrom: 5000,
    },

    // ---- Cabeleireiro ----
    {
        id: '7',
        name: 'Barbeiro',
        description: 'Corte, barba e estilo que falam por você. Autenticidade no detalhe.',
        image: u('1503951914875-452162b0f3f1'),
        category: 'cabeleireiro',
        priceFrom: 4000,
    },
    {
        id: '8',
        name: 'Cabeleireiro',
        description: 'Corte, tratamento e estilo sob medida para o seu dia a dia.',
        image: u('1634449571010-02389ed0f9b0'),
        category: 'cabeleireiro',
        priceFrom: 6000,
    },

    // ---- Cocktail ----
    {
        id: '9',
        name: 'Cocktail',
        description: 'Mistura perfeita entre sabor e estilo. Drinks que transformam momentos.',
        image: u('1470337458703-46ad1756a187'),
        category: 'cocktail',
        priceFrom: 25000,
    },

    // ---- Decoração ----
    {
        id: '10',
        name: 'Decoração de Eventos',
        description: 'Montagem e decoração temática para festas e eventos especiais.',
        image: u('1653821355736-0c2598d0a63e'),
        category: 'decoracao',
        priceFrom: 35000,
    },

    // ---- Fitness ----
    {
        id: '11',
        name: 'Personal Trainer',
        description: 'Treinos personalizados, presenciais ou ao domicílio.',
        image: u('1648542036561-e1d66a5ae2b1'),
        category: 'fitness',
        priceFrom: 9000,
    },

    // ---- Tecnologia ----
    {
        id: '12',
        name: 'Design Gráfico',
        description: 'Identidade visual moderna e criativa para a sua marca se destacar.',
        image: u('1626785774573-4b799315345d'),
        category: 'tecnologia',
        priceFrom: 15000,
    },
    {
        id: '13',
        name: 'Fotografia',
        description: 'Ensaios, eventos e retratos com edição profissional e entrega rápida.',
        image: u('1542038784456-1ea8e935640e'),
        category: 'tecnologia',
        priceFrom: 18000,
    },
    {
        id: '14',
        name: 'Suporte Técnico',
        description: 'Formatação, redes e manutenção de computadores ao domicílio.',
        image: u('1604754742629-3e5728249d73'),
        category: 'tecnologia',
        priceFrom: 7000,
    },

    // ---- Educação ----
    {
        id: '15',
        name: 'Explicações',
        description: 'Reforço escolar e preparação para exames, no seu ritmo.',
        image: u('1522881193457-37ae97c905bf'),
        category: 'educacao',
        priceFrom: 5000,
    },

    // ---- Saúde ----
    {
        id: '16',
        name: 'Fisioterapia',
        description: 'Sessões de reabilitação e alívio de dores ao domicílio.',
        image: u('1649751361457-01d3a696c7e6'),
        category: 'saude',
        priceFrom: 12000,
    },
    {
        id: '17',
        name: 'Nutrição',
        description: 'Planos alimentares personalizados e acompanhamento próximo.',
        image: u('1512621776951-a57141f2eefd'),
        category: 'saude',
        priceFrom: 10000,
    },

    // ---- Outros ----
    {
        id: '18',
        name: 'Pastelaria',
        description: 'Sabores que despertam sorrisos. Cada doce feito com paixão e detalhe.',
        image: u('1597528662465-55ece5734101'),
        category: 'outros',
        priceFrom: 8000,
    },
    {
        id: '19',
        name: 'Costura',
        description: 'Ajustes, reparações e confeção de roupa sob medida.',
        image: u('1606501126768-b78d4569d3f9'),
        category: 'outros',
        priceFrom: 6000,
    },
];

/** Formata um valor em Kwanzas, ex: 20000 -> "20.000 Kz". */
export function formatKz(value: number) {
    return `${value.toLocaleString('pt-PT')} Kz`;
}
