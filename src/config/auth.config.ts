// Simulação de variáveis de ambiente para autenticação
// Em produção, isso seria substituído por chamadas reais à API

export const MOCK_USERS = [
  {
    email: "lourencocardoso007@gmail.com",
    pass: "lorrys1234",
    name: "Lourenço Cardoso",
    role: "client" as const
  },
  {
    email: "edson009@gmail.com",
    pass: "edsonvaleri009",
    name: "Edson Valeri",
    role: "professional" as const
  }
];

export const GOOGLE_CONFIG = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "1903676666-pjmmcc67g8fobv92fbgemi7anvfo7l9t.apps.googleusercontent.com",
};
