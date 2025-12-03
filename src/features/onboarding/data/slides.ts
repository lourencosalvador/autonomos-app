import type { ImageSourcePropType } from "react-native";

export type OnboardingCopy = {
    lead: string;
    highlight: string;
    tail: string;
};

export type OnboardingSlide = {
    id: string;
    eyebrow: string;
    copy: OnboardingCopy;
    description: string;
    accent: string;
    image: ImageSourcePropType;
};

const sharedImage = require("../../../../assets/images/image-step-1.png");

export const onboardingSlides: OnboardingSlide[] = [
    {
        id: "connect",
        eyebrow: "Conexões inteligentes",
        copy: {
            lead: "O app que",
            highlight: "conecta",
            tail: "quem faz com quem precisa.",
        },
        description: "Conheça oportunidades alinhadas ao seu perfil em poucos toques.",
        accent: "#00E7FF",
        image: sharedImage,
    },
    {
        id: "organize",
        eyebrow: "Gestão sem atrito",
        copy: {
            lead: "Organize suas entregas",
            highlight: "no seu ritmo",
            tail: "e visualize cada etapa.",
        },
        description: "Rotas, clientes e pagamentos centralizados em um único painel.",
        accent: "#7AE6FF",
        image: sharedImage,
    },
    {
        id: "grow",
        eyebrow: "Resultado real",
        copy: {
            lead: "Cresça com insights",
            highlight: "em tempo real",
            tail: "e garanta novos contratos.",
        },
        description: "Receba alertas personalizados e mantenha a agenda sempre cheia.",
        accent: "#46B4FF",
        image: sharedImage,
    },
];

