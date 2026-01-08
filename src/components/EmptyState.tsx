import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Props = {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  size?: 'sm' | 'md';
};

export function EmptyState({
  title,
  description,
  icon = 'information-circle-outline',
  actionLabel,
  onAction,
  size = 'md',
}: Props) {
  const iconBox = size === 'sm' ? 'h-12 w-12' : 'h-16 w-16';
  const iconSize = size === 'sm' ? 22 : 26;
  const titleSize = size === 'sm' ? 'text-[14px]' : 'text-[16px]';
  const descSize = size === 'sm' ? 'text-[11px]' : 'text-[13px]';

  return (
    <View className="items-center justify-center py-10 px-6">
      <View className={`items-center justify-center rounded-full bg-cyan-50 ${iconBox}`}>
        <Ionicons name={icon} size={iconSize} color="#00E7FF" />
      </View>

      <Text className={`mt-4 font-extrabold text-gray-900 ${titleSize}`}>{title}</Text>

      {description ? (
        <Text className={`mt-2 text-center font-bold text-gray-400 ${descSize}`}>{description}</Text>
      ) : null}

      {actionLabel && onAction ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onAction}
          className="mt-5 h-11 px-6 items-center justify-center rounded-full bg-brand-cyan"
        >
          <Text className="text-[13px] font-extrabold text-white">{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}


