import type { ImageSourcePropType } from "react-native";

export type OnboardingCopy = {
    lead: string;
    highlight: string;
    tail: string;
};

export type OnboardingSlide = {
    id: string;
    copy: OnboardingCopy;
    accent: string;
    image: ImageSourcePropType;
};

const sharedImage = require("../../../../assets/images/image-step-1.png");
const sharedImage2 = require("../../../../assets/images/image-step-2.jpg");
const sharedImage3 = require("../../../../assets/images/image-step-3.jpg");
export const onboardingSlides: OnboardingSlide[] = [
    {
        id: "connect",
        copy: {
            lead: "O app que",
            highlight: "conecta",
            tail: "quem faz com quem precisa.",
        },
        accent: "#00E7FF",
        image: sharedImage,
    },
    {
        id: "organize",
        copy: {
            lead: "Encontre",
            highlight: "profissionais",
            tail: " de confiança, perto de você, em poucos cliques.",
        }, 
        accent: "#7AE6FF",
        image: sharedImage2,
    },
    {
        id: "grow",
        copy: {
            lead: " Mostre seu",
            highlight: "talento",
            tail: "conquiste clientes e aumente sua renda.",
        },
        accent: "#46B4FF",
        image: sharedImage3,
    },
];

