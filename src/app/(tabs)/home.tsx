import { services } from '@/src/data/services';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Image, ImageBackground, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import IconHartCyan from '../../../assets/icons/hart-cyan.svg';
import IconNotification from '../../../assets/icons/ICON NOTIFICATION.svg';
import IconClock from '../../../assets/icons/icon-clock-new.svg';
import IconEdit from '../../../assets/icons/icon-edit.svg';
import IconRowView from '../../../assets/icons/row-view.svg';
import { categories } from '../../data/categories';
import { useAuthStore } from '../../stores/authStore';

type CategoryId =
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

export default function HomeScreen() {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] || 'Usuário';

  const [selectedId, setSelectedId] = useState<CategoryId>('casa');

  const getContent = () => {
    switch (selectedId) {
      case 'casa':
        return <CasaSection />;
      case 'beleza':
        return <BelezaSection />;
      case 'decoracao':
        return <DecoracaoSection />;
      case 'cocktail':
        return <CocktailSection />;
      case 'cabeleireiro':
        return <CabeleireiroSection />;
      case 'fitness':
        return <FitnessSection />;
      case 'tecnologia':
        return <TecnologiaSection />;
      case 'educacao':
        return <EducacaoSection />;
      case 'saude':
        return <SaudeSection />;
      case 'outros':
        return <OutrosSection />;
      default:
        return <CasaSection />;
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-20 mb-8">
          <View className="mb-6 flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-[28px] font-bold text-gray-900">
                Olá, {firstName}
              </Text>
              <Text className="mt-1 text-[15px] text-gray-500 font-bold">
                Bem vindo de volta!
              </Text>
            </View>

            <TouchableOpacity
              className="relative w-12 h-12 items-center justify-center"
              activeOpacity={0.7}
            >
              <View className='absolute top-1 right-3 h-3 w-3 rounded-full bg-brand-cyan z-40' />
              <IconNotification width={94} height={94} />
            </TouchableOpacity>
          </View>

          <View className="mb-6 flex-row items-center rounded-full bg-[#D9D9D966] px-2 py-2">
            <TextInput
              className="flex-1 text-[15px] text-gray-700 pl-4"
              placeholder="Pesquisar"
              placeholderTextColor="#9CA3AF"
            />
            <View className='p-4 flex justify-center items-center rounded-full bg-white'>
              <Ionicons name="search" size={22} color="#9CA3AF" />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16 }}
          >
            {categories.map((category, index) => {
              const isActive = selectedId === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  className="items-center"
                  activeOpacity={0.7}
                  onPress={() => setSelectedId(categories[index].id as CategoryId)}
                >
                  <View className="mb-2 h-20 w-20 items-center justify-center rounded-full border-[3px] border-brand-cyan/30 bg-[]" style={{ backgroundColor: isActive ? '#FFFF' : '#f3f4f6', borderColor: isActive ? '#00E7FF' : '#00E7FF' }}>
                    <category.Icon
                      size={32}
                      color={isActive ? '#00E7FF' : '#99999991'}
                      strokeWidth={category.stroke}
                    />
                  </View>
                  <Text className="text-[12px] text-[#99999999]">
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        <View className="flex-1 px-6">{getContent()}</View>
      </ScrollView>
    </View>
  );
}


// ====================== SEÇÕES DE CONTEÚDO ======================

const SectionTitle = ({ children }: { children: string }) => (
  <Text className="text-2xl font-bold text-white mb-4">{children}</Text>
);

const CasaSection = () => (
  <View className='w-auto h-auto justify-between gap-8'>
    <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ gap: 8 }}
  >
    <View className="w-[22rem] h-[15rem] rounded-3xl bg-brand-cyan px-4 py-5 flex-row justify-between">

      <View className="flex-1 justify-between flex gap-4">
        <View className="gap-3 mb-2">
          <Text className="text-[#034660] text-[12px] font-bold leading-[20px]">
            Encontre o profissional{"\n"}certo em minutos.
          </Text>
          <Text className="text-[#034660] text-[11px] font-medium leading-6">
            Serviços de confiança,  perto  {"\n"} de você
            Rápido, seguro e sem  {"\n"} complicação.
          </Text>
        </View>

        <View className="items-start">
          <Image
            source={require('../../../assets/images/splash-icon.png')}
            style={{ width: 100, height: 36 }}
            resizeMode="contain"

          />
        </View>
      </View>


      <View className="items-start mt-4">
        <IconClock width={105} height={105} />
      </View>
    </View>
    <View className="w-[22rem] h-[15rem] rounded-3xl bg-[#034660] px-4 py-5 flex-row justify-between">

      <View className="flex-1 justify-between flex gap-4">
        <View className="gap-3 mb-2">
          <Text className="text-brand-cyan text-[12px] font-bold leading-[20px]">
            Encontre o profissional{"\n"}certo em minutos.
          </Text>
          <Text className="text-white text-[11px] font-medium leading-6">
            Serviços de confiança,  perto  {"\n"} de você
            Rápido, seguro e sem  {"\n"} complicação.
          </Text>
        </View>

        <View className="items-start">
          <Image
            source={require('../../../assets/images/logo-cyan.png')}
            style={{ width: 100, height: 36 }}
            resizeMode="contain"
          />
        </View>
      </View>


      <View className="items-start mt-4">
        <IconEdit width={100} height={105} />
      </View>
    </View>
    <View className="w-[22rem] h-[15rem] rounded-3xl bg-brand-cyan px-4 py-5 flex-row justify-between">

      <View className="flex-1 justify-between flex gap-4">
        <View className="gap-3 mb-2">
          <Text className="text-[#034660] text-[12px] font-bold leading-[20px]">
            Encontre o profissional{"\n"}certo em minutos.
          </Text>
          <Text className="text-[#034660] text-[11px] font-medium leading-6">
            Serviços de confiança,  perto  {"\n"} de você
            Rápido, seguro e sem  {"\n"} complicação.
          </Text>
        </View>

        <View className="items-start">
          <Image
            source={require('../../../assets/images/splash-icon.png')}
            style={{ width: 100, height: 36 }}
            resizeMode="contain"

          />
        </View>
      </View>


      <View className="items-start mt-4">
        <IconClock width={105} height={105} />
      </View>
    </View>
  </ScrollView>

  <View className='w-auto h-auto justify-between gap-8'>
    <View className='w-full justify-between items-center flex-row'>
    <Text className="text-[15px] font-bold text-zinc-900">Mais Solicitados</Text>
    <Text className="text-[15px] font-bold text-brand-cyan">Ver tudo</Text>   
    </View>
    <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ gap: 8 }}
  >
    {services.map((service) => (
     <View
      key={service.id}
      className="w-[21rem] h-[16rem] rounded-3xl overflow-hidden"
      >
     <ImageBackground 
    source={service.image}
     resizeMode="cover"
     className="w-full h-full rounded-3xl px-4 py-5 flex justify-between"
     >
       <View className='w-full flex flex-row justify-end items-end'>
         <IconHartCyan width={24} height={24} />
       </View>
       <View className='w-full flex flex-row justify-between items-center'>
         <View className='w-full flex flex-col gap-1'>
           <Text className="text-[19px] font-bold text-brand-cyan">{service.name}</Text>
           <Text className="text-[13px] font-normal text-slate-100/70 w-[13rem]">{service.description}</Text>
         </View>
        <View className='w-auto h-auto -ml-12'>
        <IconRowView width={30} height={30}/>
        </View>
       </View>
     </ImageBackground>
   </View>
    ))}
    </ScrollView>
  </View>
  </View>
);

const BelezaSection = () => (
  <View>
    <SectionTitle>Decoração & Design</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Designers de interiores, montagem de móveis, organização de ambientes.
    </Text>
  </View>
);

const DecoracaoSection = () => (
  <View>
    <SectionTitle>Decoração & Design</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Designers de interiores, montagem de móveis, organização de ambientes.
    </Text>
  </View>
);

const CocktailSection = () => (
  <View>
    <SectionTitle>Cocktail & Bar</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Bartenders profissionais para festas, eventos e drinks personalizados.
    </Text>
  </View>
);

const CabeleireiroSection = () => (
  <View>
    <SectionTitle>Cabeleireiro & Barba</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Corte, coloração, barba, tratamento capilar... em casa ou no salão.
    </Text>
  </View>
);

const FitnessSection = () => (
  <View>
    <SectionTitle>Fitness & Treino</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Personal trainers, yoga, pilates, funcional... treine onde quiser.
    </Text>
  </View>
);

const TecnologiaSection = () => (
  <View>
    <SectionTitle>Tecnologia & Suporte</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Formatação, instalação de redes, conserto de celular, aulas de informática.
    </Text>
  </View>
);

const EducacaoSection = () => (
  <View>
    <SectionTitle>Educação & Aulas</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Reforço escolar, idiomas, música, culinária... aprenda no seu ritmo.
    </Text>
  </View>
);

const SaudeSection = () => (
  <View>
    <SectionTitle>Saúde & Bem-estar</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Fisioterapia, enfermagem, nutricionista, psicologia... cuidando de você.
    </Text>
  </View>
);

const OutrosSection = () => (
  <View>
    <SectionTitle>Outros Serviços</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Pet care, costura, fotografia, eventos... tem de tudo!
    </Text>
  </View>
);