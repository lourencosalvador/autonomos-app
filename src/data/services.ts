type Service = {
    id: string;
    name: string;
    description: string;
    image: any;
}

export const services: Service[] = [
    {
        id: '1',
        name: 'Barbeiro',
        description: 'Corte, barba e estilo que falam por você Autenticidade em cada detalhe.',
        image: require('../../assets/images/solicit-1.png'),
    },
    {
        id: '2',
        name: 'Pastelaria',
        description: 'Sabores que despertam sorrisos Cada doce feito com paixão e detalhe',
        image: require('../../assets/images/solicit-2.png'),
    },
    {
        id: '3',
        name: 'Cocktail',
        description: 'Mistura perfeita entre sabor e estilo Drinks que transformam momentos.',
        image: require('../../assets/images/solicit-3.png'),
    },
    {
        id: '4',
        name: 'Design Gráfico',
        description: 'Identidade visual moderna e criativa para sua marca se destacar.',
        image: require('../../assets/images/home-screen.jpg'),
    },
    {
        id: '5',
        name: 'Fotografia',
        description: 'Ensaios, eventos e retratos com edição profissional e entrega rápida.',
        image: require('../../assets/images/solicit-1.jpg'),
    },
    {
        id: '6',
        name: 'Cabeleireiro',
        description: 'Corte, tratamento e estilo sob medida para o seu dia a dia.',
        image: require('../../assets/images/image-step-2.jpg'),
    },
]