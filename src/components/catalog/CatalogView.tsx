import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { formatKz } from '../../data/services';
import { isSupabaseConfigured, supabase, type ProviderCatalogRow } from '../../lib/supabase';
import { toast } from '../../lib/sonner';
import { uploadPortfolioImageToSupabase } from '../../services/portfolioUpload';
import { EmptyState } from '../EmptyState';

type Mode = 'owner' | 'public';

type Props = {
  mode: Mode;
  providerId: string;
  // Para encaminhar o pedido (modo público):
  providerName?: string;
  providerJob?: string;
  providerAvatarUrl?: string;
  serviceName?: string;
};

export function CatalogView({ mode, providerId, providerName, providerJob, providerAvatarUrl, serviceName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ProviderCatalogRow[]>([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal de criação (owner)
  const [createOpen, setCreateOpen] = useState(false);
  const [draftUri, setDraftUri] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftPrice, setDraftPrice] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal de detalhe (público) + quantidade
  const [detail, setDetail] = useState<ProviderCatalogRow | null>(null);
  const [qty, setQty] = useState(1);

  const load = async () => {
    if (!isSupabaseConfigured || !providerId) return;
    setLoading(true);
    setTableMissing(false);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('provider_catalog')
        .select('id, provider_id, name, description, price_amount, currency, image_url, created_at')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(((data || []) as any) as ProviderCatalogRow[]);
    } catch (e: any) {
      const msg = String(e?.message || '');
      const looksLikeMissingTable = /could not find the table|relation .*provider_catalog|does not exist/i.test(msg);
      if (looksLikeMissingTable) {
        setTableMissing(true);
      }
      setLoadError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error('Permita o acesso à galeria.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.9 });
    if (!result.canceled && result.assets?.[0]?.uri) setDraftUri(result.assets[0].uri);
  };

  const openCreate = () => {
    setDraftUri(null);
    setDraftName('');
    setDraftPrice('');
    setDraftDesc('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!draftName.trim()) return toast.error('Dê um nome ao item.');
    const price = parseInt(draftPrice.replace(/[^\d]/g, ''), 10);
    if (!Number.isFinite(price) || price <= 0) return toast.error('Informe um preço válido (Kz).');
    try {
      setSaving(true);
      toast.loading('Guardando item...');
      let imageUrl: string | null = null;
      if (draftUri) {
        const up = await uploadPortfolioImageToSupabase({ userId: providerId, uri: draftUri });
        imageUrl = up.publicUrl;
      }
      const { error } = await supabase.from('provider_catalog').insert({
        provider_id: providerId,
        name: draftName.trim(),
        description: draftDesc.trim() || null,
        price_amount: price,
        currency: 'AOA',
        image_url: imageUrl,
      } as any);
      if (error) throw error;
      toast.success('Item adicionado ao catálogo!');
      setCreateOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível adicionar o item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: ProviderCatalogRow) => {
    toast.loading('Removendo...');
    supabase
      .from('provider_catalog')
      .delete()
      .eq('id', item.id)
      .eq('provider_id', providerId)
      .then(({ error }) => {
        if (error) return toast.error(error.message);
        toast.success('Item removido.');
        load();
      });
  };

  const openDetail = (item: ProviderCatalogRow) => {
    setQty(1);
    setDetail(item);
  };

  const requestItem = () => {
    if (!detail) return;
    const total = detail.price_amount * qty;
    const lines = [
      `Pedido do catálogo: ${qty}x ${detail.name}`,
      `Preço unitário: ${formatKz(detail.price_amount)} · Total estimado: ${formatKz(total)}`,
      detail.description ? `\n${detail.description}` : '',
    ].filter(Boolean);
    setDetail(null);
    router.push({
      pathname: '/termos-servico',
      params: {
        serviceName: serviceName || detail.name,
        providerId,
        providerName: providerName || 'Prestador',
        providerJob: providerJob || serviceName || 'Profissional',
        providerAvatarUrl: providerAvatarUrl || undefined,
        initialDescription: lines.join('\n'),
        estimatedAmount: String(total),
      },
    });
  };

  if (!isSupabaseConfigured) return null;

  if (tableMissing) {
    return (
      <View className="py-8">
        <EmptyState
          icon="alert-circle-outline"
          title="Catálogo por configurar"
          description={loadError ? `Verifique se a migration foi aplicada no mesmo projeto do Supabase usado pelo app. Detalhes: ${loadError}` : 'Rode "supabase_catalog_migration.sql" no Supabase do projeto que o app está a usar para ativar o catálogo.'}
          actionLabel="Tentar novamente"
          onAction={load}
        />
      </View>
    );
  }

  const isEmpty = !loading && items.length === 0;

  return (
    <View>
      {/* Grid */}
      {loading ? (
        <View className="py-10 items-center justify-center">
          <ActivityIndicator color="#00E7FF" />
        </View>
      ) : isEmpty && mode === 'public' ? (
        <View className="py-8">
          <EmptyState icon="pricetags-outline" title="Catálogo vazio" description="Este prestador ainda não adicionou itens." />
        </View>
      ) : (
        <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
          {mode === 'owner' ? (
            <TileWrapper>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={openCreate}
                className="items-center justify-center rounded-2xl bg-cyan-50"
                style={{ width: '100%', aspectRatio: 1, borderWidth: 1.5, borderColor: '#A5F3FC', borderStyle: 'dashed' }}
              >
                <Ionicons name="add" size={28} color="#00A9BA" />
                <Text className="mt-1 text-[10px] font-extrabold text-cyan-700">Adicionar</Text>
              </TouchableOpacity>
            </TileWrapper>
          ) : null}

          {items.map((item) => (
            <TileWrapper key={item.id}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => (mode === 'owner' ? undefined : openDetail(item))}
                onLongPress={mode === 'owner' ? () => handleDelete(item) : undefined}
                className="overflow-hidden rounded-2xl bg-gray-100"
                style={{ width: '100%', aspectRatio: 1 }}
              >
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="image-outline" size={26} color="#9CA3AF" />
                  </View>
                )}
                {mode === 'owner' ? (
                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                  >
                    <Ionicons name="trash-outline" size={14} color="#fff" />
                  </TouchableOpacity>
                ) : null}
                {/* preço no canto */}
                <View className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-0.5">
                  <Text className="text-[10px] font-extrabold text-white">{formatKz(item.price_amount)}</Text>
                </View>
              </TouchableOpacity>
              <Text className="mt-1 text-[11px] font-bold text-gray-700" numberOfLines={1}>
                {item.name}
              </Text>
            </TileWrapper>
          ))}
        </View>
      )}

      {mode === 'owner' && isEmpty ? (
        <Text className="mt-2 text-center text-[11.5px] font-bold text-gray-400">
          Adicione itens (foto, preço e descrição) que os clientes poderão solicitar.
        </Text>
      ) : null}

      {/* Modal criar (owner) */}
      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => (saving ? null : setCreateOpen(false))}>
          <Pressable className="rounded-t-3xl bg-white px-5 pt-4 pb-8" onPress={() => Keyboard.dismiss()}>
            <View className="items-center mb-2">
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </View>
            <Text className="text-[17px] font-extrabold text-gray-900">Novo item do catálogo</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
              <TouchableOpacity onPress={pickImage} activeOpacity={0.85} className="mt-4 overflow-hidden rounded-2xl bg-gray-100 items-center justify-center" style={{ height: 160, borderWidth: 1.5, borderColor: '#EEF2F7', borderStyle: draftUri ? 'solid' : 'dashed' }}>
                {draftUri ? (
                  <Image source={{ uri: draftUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={26} color="#00A9BA" />
                    <Text className="mt-1 text-[12px] font-extrabold text-gray-500">Adicionar foto</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text className="mt-4 text-[12px] font-extrabold text-gray-900">Nome</Text>
              <View className="mt-2 rounded-2xl bg-gray-50 px-4 py-3" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
                <TextInput value={draftName} onChangeText={setDraftName} placeholder="Ex: Corte escovinha" placeholderTextColor="#9CA3AF" className="text-[13px] text-gray-800" maxLength={60} />
              </View>

              <Text className="mt-4 text-[12px] font-extrabold text-gray-900">Preço (Kz)</Text>
              <View className="mt-2 rounded-2xl bg-gray-50 px-4 py-3" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
                <TextInput
                  value={draftPrice}
                  onChangeText={(t) => setDraftPrice(t.replace(/[^\d]/g, ''))}
                  placeholder="Ex: 5000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={Keyboard.dismiss}
                  className="text-[13px] text-gray-800"
                />
              </View>

              <Text className="mt-4 text-[12px] font-extrabold text-gray-900">Descrição</Text>
              <View className="mt-2 rounded-2xl bg-gray-50 px-4 py-3" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
                <TextInput value={draftDesc} onChangeText={setDraftDesc} placeholder="Detalhes do item/serviço..." placeholderTextColor="#9CA3AF" multiline textAlignVertical="top" className="min-h-[70px] text-[13px] leading-5 text-gray-800" maxLength={300} />
              </View>
            </ScrollView>

            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity onPress={() => (saving ? null : setCreateOpen(false))} activeOpacity={0.85} className="flex-1 h-12 items-center justify-center rounded-full bg-gray-100">
                <Text className="text-[13px] font-extrabold text-gray-700">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} disabled={saving} activeOpacity={0.85} className="flex-1 h-12 flex-row items-center justify-center gap-2 rounded-full bg-brand-cyan" style={{ opacity: saving ? 0.6 : 1 }}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : null}
                <Text className="text-[13px] font-extrabold text-white">{saving ? 'A guardar...' : 'Adicionar'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal detalhe (público) com quantidade */}
      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setDetail(null)}>
          <Pressable className="rounded-t-3xl bg-white pb-8" onPress={() => Keyboard.dismiss()}>
            {detail?.image_url ? (
              <Image source={{ uri: detail.image_url }} style={{ width: '100%', height: 240 }} resizeMode="cover" className="rounded-t-3xl" />
            ) : (
              <View style={{ height: 120 }} className="items-center justify-center rounded-t-3xl bg-gray-100">
                <Ionicons name="image-outline" size={30} color="#9CA3AF" />
              </View>
            )}
            <View className="px-5 pt-4">
              <Text className="text-[18px] font-extrabold text-gray-900">{detail?.name}</Text>
              <Text className="mt-2 text-[22px] font-extrabold text-gray-900">{detail ? formatKz(detail.price_amount) : ''}</Text>
              <Text className="mt-0.5 text-[11px] font-bold text-gray-400">Preço por unidade</Text>

              {detail?.description ? (
                <Text className="mt-3 text-[13px] leading-5 text-gray-600">{detail.description}</Text>
              ) : null}

              {/* Quantidade */}
              <View className="mt-5 flex-row items-center justify-between">
                <Text className="text-[14px] font-extrabold text-gray-900">Quantidade</Text>
                <View className="flex-row items-center gap-4 rounded-full bg-gray-100 px-2 py-1.5">
                  <TouchableOpacity onPress={() => setQty((q) => Math.max(1, q - 1))} className="h-9 w-9 items-center justify-center rounded-full bg-white" activeOpacity={0.8}>
                    <Ionicons name="remove" size={18} color="#0F172A" />
                  </TouchableOpacity>
                  <Text className="min-w-[24px] text-center text-[16px] font-extrabold text-gray-900">{qty}</Text>
                  <TouchableOpacity onPress={() => setQty((q) => Math.min(99, q + 1))} className="h-9 w-9 items-center justify-center rounded-full bg-brand-cyan" activeOpacity={0.8}>
                    <Ionicons name="add" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-cyan-50 px-4 py-3">
                <Text className="text-[12px] font-bold text-cyan-700/80">Total estimado</Text>
                <Text className="text-[18px] font-extrabold text-cyan-900">{detail ? formatKz(detail.price_amount * qty) : ''}</Text>
              </View>

              <TouchableOpacity onPress={requestItem} activeOpacity={0.85} className="mt-5 h-13 flex-row items-center justify-center gap-2 rounded-full bg-brand-cyan" style={{ height: 54 }}>
                <Ionicons name="briefcase-outline" size={18} color="#fff" />
                <Text className="text-[14px] font-extrabold text-white">Solicitar ({qty})</Text>
              </TouchableOpacity>
              <Text className="mt-2 text-center text-[10.5px] font-bold text-gray-400">O valor final é confirmado pelo prestador antes do pagamento.</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Tile de 3 colunas com gutters consistentes.
function TileWrapper({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ width: '33.333%', paddingHorizontal: 4, marginBottom: 10 }}>{children}</View>
  );
}
