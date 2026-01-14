import { Keyboard, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

export function ConfirmPaymentModal(props: {
  visible: boolean;
  providerName: string;
  serviceName: string;
  amountLabel: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <Pressable className="flex-1 bg-black/50 items-center justify-end px-5 pb-10" onPress={Keyboard.dismiss}>
        <Pressable className="w-full rounded-3xl bg-white p-5" onPress={() => {}} style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
          <Text className="text-[16px] font-extrabold text-gray-900">Confirmar pagamento</Text>
          <Text className="mt-1 text-[12px] text-gray-500">
            Ao pagar, você confirma que o serviço <Text className="font-extrabold text-gray-700">{props.serviceName}</Text> com{' '}
            <Text className="font-extrabold text-gray-700">{props.providerName}</Text> foi concluído.
          </Text>

          <View className="mt-4 rounded-2xl bg-gray-100 px-4 py-4">
            <Text className="text-[12px] text-gray-600">
              - Se o serviço ainda estiver em andamento, volte depois para pagar.
            </Text>
            <Text className="mt-2 text-[12px] text-gray-600">
              - Após o pagamento, o pedido será marcado como <Text className="font-extrabold text-gray-700">Concluído</Text>.
            </Text>
            {props.amountLabel ? (
              <Text className="mt-3 text-[13px] font-extrabold text-gray-900">
                Total: {props.amountLabel}
              </Text>
            ) : null}
          </View>

          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={props.onClose}
              className="flex-1 h-12 items-center justify-center rounded-full bg-gray-100"
            >
              <Text className="text-[14px] font-extrabold text-gray-700">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={props.onConfirm}
              className="flex-1 h-12 items-center justify-center rounded-full bg-brand-cyan"
            >
              <Text className="text-[14px] font-extrabold text-white">Continuar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


