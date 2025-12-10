type Service = {
    id: string;
    name: string;
    description: string;
    image: string;
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
]