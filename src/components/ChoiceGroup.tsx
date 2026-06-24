import { Text, TouchableOpacity, View } from 'react-native';

export type Choice<T> = { label: string; value: T };

type Props<T> = {
  label: string;
  options: Choice<T>[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  /** Cor de destaque quando a opção é "negativa" (ex: comportamento inadequado = sim). */
  tone?: 'cyan' | 'amber';
  disabled?: boolean;
};

export function ChoiceGroup<T extends string | number | boolean>({ label, options, value, onChange, tone = 'cyan', disabled }: Props<T>) {
  const activeBg = tone === 'amber' ? '#F59E0B' : '#00E7FF';
  return (
    <View className="mb-5">
      <Text className="text-[13px] font-extrabold text-gray-900">{label}</Text>
      <View className="mt-3 flex-row gap-2.5">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              activeOpacity={0.85}
              disabled={disabled}
              onPress={() => onChange(opt.value)}
              className="flex-1 h-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: selected ? activeBg : '#F3F4F6',
                borderWidth: 1,
                borderColor: selected ? activeBg : '#EEF2F7',
              }}
            >
              <Text className="text-[13px] font-extrabold" style={{ color: selected ? '#fff' : '#6B7280' }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
