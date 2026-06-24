import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  status?: 'pending' | 'rejected' | null;
  note?: string | null;
  onClose: () => void;
};

export function GateModal({ visible, status, note, onClose }: Props) {
  const rejected = status === 'rejected';
  const color = rejected ? '#EF4444' : '#F59E0B';
  const bg = rejected ? '#FEF2F2' : '#FFFBEB';
  const icon = rejected ? 'close-circle' : 'time';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 items-center justify-center px-7" onPress={onClose}>
        <Pressable className="w-full rounded-3xl bg-white px-6 pt-7 pb-6 items-center" onPress={() => {}}>
          <MotiView from={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12 }}>
            <View style={{ height: 76, width: 76, borderRadius: 38, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon as any} size={40} color={color} />
            </View>
          </MotiView>

          <Text className="mt-5 text-[19px] font-extrabold text-gray-900 text-center">
            {rejected ? 'Conta não aprovada' : 'Conta em análise'}
          </Text>

          <Text className="mt-2 text-[13.5px] font-bold text-gray-500 text-center leading-5">
            {rejected
              ? 'A sua candidatura não foi aprovada de momento. Pode atualizar o seu perfil e falar com o suporte.'
              : 'Estamos a analisar o seu perfil. Assim que for aprovado pela nossa equipa, terá acesso a tudo. Enquanto isso, só o seu Perfil está disponível.'}
          </Text>

          {rejected && note ? (
            <View className="mt-4 w-full rounded-2xl bg-red-50 px-4 py-3">
              <Text className="text-[11px] font-extrabold text-red-700">Motivo</Text>
              <Text className="mt-1 text-[12.5px] font-bold text-red-900/80">{note}</Text>
            </View>
          ) : null}

          {!rejected ? (
            <View className="mt-4 w-full rounded-2xl bg-amber-50 px-4 py-3 flex-row items-center gap-2">
              <Ionicons name="information-circle" size={16} color="#D97706" />
              <Text className="flex-1 text-[11.5px] font-bold text-amber-800">Costuma levar pouco tempo. Vais ser notificado quando for aprovado.</Text>
            </View>
          ) : null}

          <TouchableOpacity onPress={onClose} activeOpacity={0.9} className="mt-6 h-12 w-full items-center justify-center rounded-full bg-brand-cyan">
            <Text className="text-[14px] font-extrabold text-white">Entendi</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
