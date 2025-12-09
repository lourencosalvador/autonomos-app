import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function SuccessModal({ visible, onClose, title = "Sucesso!", message = "Operação realizada com sucesso." }: SuccessModalProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible) {
      animationRef.current?.play();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-3xl bg-white p-8 items-center">
          <LottieView
            ref={animationRef}
            source={require('../animation/animation-sucess.json')}
            style={{ width: 150, height: 150 }}
            autoPlay
            loop={false}
          />

          <Text className="mt-4 text-2xl font-bold text-gray-900">
            {title}
          </Text>

          <Text className="mt-3 text-center text-base text-gray-600">
            {message}
          </Text>

          <TouchableOpacity
            className="mt-8 w-full rounded-full bg-brand-cyan py-4"
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Text className="text-center text-base font-bold text-white">
              Continuar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

