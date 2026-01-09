import { Calendar, fromDateId, toDateId } from '@marceloterreiro/flash-calendar';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  open: boolean;
  title?: string;
  value?: string | null; // YYYY-MM-DD
  onClose: () => void;
  onConfirm: (isoDate: string) => void; // YYYY-MM-DD
};

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function shiftMonth(dateId: string, deltaMonths: number) {
  const d = fromDateId(dateId);
  const next = new Date(d.getFullYear(), d.getMonth() + deltaMonths, 1);
  return toDateId(next);
}

function formatMonthYearPt(dateId: string) {
  const d = fromDateId(dateId);
  const label = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function DatePickerModal({ open, title = 'Selecionar data', value, onClose, onConfirm }: Props) {
  const initial = useMemo(() => {
    if (!value) return toIsoDate(new Date());
    // aceita YYYY-MM-DD
    return value;
  }, [value]);

  const [selected, setSelected] = useState<string>(initial);
  const [visibleMonthId, setVisibleMonthId] = useState<string>(initial);
  const [yearOpen, setYearOpen] = useState(false);

  // sempre que abrir, sincroniza
  useEffect(() => {
    if (open) {
      setSelected(initial);
      setVisibleMonthId(initial);
    }
  }, [open, initial]);

  const years = useMemo(() => {
    const base = fromDateId(selected).getFullYear();
    const list: number[] = [];
    for (let y = base - 80; y <= base + 5; y++) list.push(y);
    return list.reverse();
  }, [selected]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 px-6" onPress={onClose}>
        <Pressable
          className="mt-28 rounded-3xl bg-white p-5"
          onPress={() => {}}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-[16px] font-extrabold text-gray-900">{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8} className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
              <Text className="text-[16px] font-extrabold text-gray-700">×</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setVisibleMonthId((m) => shiftMonth(m, -1))}
                className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Text className="text-[18px] font-extrabold text-gray-700">{'<'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setYearOpen(true)}
                className="px-4 py-2 rounded-full bg-gray-100"
              >
                <Text className="text-[13px] font-extrabold text-gray-900">{formatMonthYearPt(visibleMonthId)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setVisibleMonthId((m) => shiftMonth(m, 1))}
                className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Text className="text-[18px] font-extrabold text-gray-700">{'>'}</Text>
              </TouchableOpacity>
            </View>

            <Calendar
              calendarMonthId={visibleMonthId}
              calendarFirstDayOfWeek="monday"
              calendarActiveDateRanges={[{ startId: selected, endId: selected }]}
              onCalendarDayPress={(dateId) => {
                setSelected(dateId);
                setVisibleMonthId(dateId);
              }}
              theme={{
                rowMonth: { container: { borderRadius: 16 } },
                itemWeekName: {
                  content: { color: '#9CA3AF', fontWeight: '800' },
                },
                itemDay: {
                  base: () => ({
                    container: { borderRadius: 999 },
                    content: { color: '#111827', fontWeight: '700' },
                  }),
                  today: () => ({
                    container: { borderRadius: 999, borderColor: '#00E7FF', borderWidth: 1.5 },
                    content: { color: '#111827', fontWeight: '800' },
                  }),
                  active: () => ({
                    container: { borderRadius: 999, backgroundColor: '#00E7FF' },
                    content: { color: '#FFFFFF', fontWeight: '800' },
                  }),
                  disabled: () => ({
                    container: { borderRadius: 999, opacity: 0.35 },
                    content: { color: '#9CA3AF' },
                  }),
                },
              }}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            className="mt-4 h-12 items-center justify-center rounded-full bg-brand-cyan"
            onPress={() => onConfirm(selected)}
          >
            <Text className="text-[14px] font-bold text-white">Confirmar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>

      <Modal visible={yearOpen} transparent animationType="fade" onRequestClose={() => setYearOpen(false)}>
        <Pressable className="flex-1 bg-black/40 px-6" onPress={() => setYearOpen(false)}>
          <Pressable
            className="mt-28 rounded-3xl bg-white p-5"
            onPress={() => {}}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text className="text-[16px] font-extrabold text-gray-900">Selecionar ano</Text>
            <Text className="mt-1 text-[12px] font-bold text-gray-400">Toque para escolher</Text>

            <View className="mt-4" style={{ height: 360 }}>
              <FlatList
                data={years}
                keyExtractor={(y) => String(y)}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                renderItem={({ item }) => {
                  const current = fromDateId(visibleMonthId).getFullYear() === item;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        const d = fromDateId(visibleMonthId);
                        const next = new Date(item, d.getMonth(), 1);
                        setVisibleMonthId(toDateId(next));
                        setYearOpen(false);
                      }}
                      className="h-12 items-center justify-center rounded-2xl bg-gray-100"
                      style={current ? { borderWidth: 1.5, borderColor: '#00E7FF', backgroundColor: '#ECFEFF' } : undefined}
                    >
                      <Text className="text-[14px] font-extrabold text-gray-900">{item}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}


