import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { isSupabaseConfigured, supabase, type ProviderPostRow } from '../../lib/supabase';
import { toast } from '../../lib/sonner';
import { uploadPortfolioImageToSupabase } from '../../services/portfolioUpload';
import { EmptyState } from '../EmptyState';

type Mode = 'owner' | 'public';

type Props = {
  mode: Mode;
  providerId: string;
  accentColors?: [string, string];
};

type StoryGroup = {
  key: string;
  title: string;
  coverUrl: string | null;
  items: ProviderPostRow[];
};

const DEFAULT_ACCENT: [string, string] = ['#034660', '#00E7FF'];

function safeDate(v: string | null | undefined) {
  const t = v ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function groupStories(posts: ProviderPostRow[]): StoryGroup[] {
  // Regra do app: "Estados" são apenas itens do tipo story (sequência)
  const storyOnly = posts.filter((p) => (p.post_type || 'post') === 'story');
  const groups: StoryGroup[] = [];

  const highlights = new Map<string, ProviderPostRow[]>();
  for (const p of storyOnly) {
    // Se por algum motivo vier sem título, agrupa em "Estados"
    const title = (p.highlight_title || '').trim() || 'Estados';
    const arr = highlights.get(title) || [];
    arr.push(p);
    highlights.set(title, arr);
  }

  for (const [title, items] of Array.from(highlights.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    const sorted = items.sort((a, b) => safeDate(a.created_at) - safeDate(b.created_at));
    groups.push({
      key: `hl:${title}`,
      title,
      coverUrl: sorted[sorted.length - 1]?.image_url || null,
      items: sorted,
    });
  }

  return groups;
}

function StoryAvatar({
  title,
  uri,
  colors,
  onPress,
}: {
  title: string;
  uri: string | null;
  colors: [string, string];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} className="items-center" style={{ width: 78 }}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 2.5, borderRadius: 999 }}
      >
        <View style={{ width: 62, height: 62, borderRadius: 999, overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
          {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : null}
        </View>
      </LinearGradient>
      <Text className="mt-2 text-[11px] text-gray-500" numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function StoryViewer({
  open,
  onClose,
  group,
  colors,
}: {
  open: boolean;
  onClose: () => void;
  group: StoryGroup | null;
  colors: [string, string];
}) {
  const [idx, setIdx] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;

  const items = group?.items || [];
  const current = items[idx];
  const duration = 4200;

  const reset = () => {
    progress.stopAnimation();
    progress.setValue(0);
  };

  const goNext = () => {
    if (!items.length) return;
    if (idx >= items.length - 1) return onClose();
    setIdx((v) => Math.min(items.length - 1, v + 1));
  };

  const goPrev = () => {
    if (!items.length) return;
    setIdx((v) => Math.max(0, v - 1));
  };

  useEffect(() => {
    if (!open) return;
    setIdx(0);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, group?.key]);

  useEffect(() => {
    if (!open) return;
    if (!items.length) return;
    reset();
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) goNext();
    });
    return () => {
      progress.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx, group?.key]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 14 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {items.map((_, i) => {
              const w = (width - 28 - (items.length - 1) * 6) / Math.max(1, items.length);
              const filled =
                i < idx
                  ? 1
                  : i === idx
                    ? (progress as any)
                    : 0;
              return (
                <View key={i} style={{ width: w, height: 3, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999, overflow: 'hidden' }}>
                  {typeof filled === 'number' ? (
                    <View style={{ width: `${filled * 100}%`, height: 3, backgroundColor: 'white' }} />
                  ) : (
                    <Animated.View
                      style={{
                        width: filled.interpolate({ inputRange: [0, 1], outputRange: [0, w] }),
                        height: 3,
                        backgroundColor: 'white',
                      }}
                    />
                  )}
                </View>
              );
            })}
          </View>

          <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 2, borderRadius: 999 }}>
                <View style={{ width: 34, height: 34, borderRadius: 999, overflow: 'hidden', backgroundColor: '#111827' }}>
                  {group?.coverUrl ? <Image source={{ uri: group.coverUrl }} style={{ width: '100%', height: '100%' }} /> : null}
                </View>
              </LinearGradient>
              <Text style={{ color: 'white', fontWeight: '800' }}>{group?.title || ''}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={26} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <Pressable
          style={{ flex: 1 }}
          onPress={(e) => {
            const x = e.nativeEvent.locationX;
            if (x < width * 0.33) return goPrev();
            return goNext();
          }}
        >
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }}>
            {current?.image_url ? (
              <Image source={{ uri: current.image_url }} style={{ width: width - 28, height: height * 0.62, borderRadius: 16 }} resizeMode="cover" />
            ) : null}

            {current?.caption ? (
              <View style={{ marginTop: 14, width: width - 28 }}>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18 }}>{current.caption}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

function PostModal({
  open,
  onClose,
  post,
  editable,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  post: ProviderPostRow | null;
  editable: boolean;
  onSave: (patch: { caption: string | null; highlight_title: string | null }) => Promise<void>;
}) {
  const [caption, setCaption] = useState('');
  const [highlight, setHighlight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCaption((post?.caption || '').toString());
    setHighlight((post?.highlight_title || '').toString());
  }, [post?.id]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 18 }} onPress={onClose}>
        <Pressable
          style={{
            marginTop: 120,
            borderRadius: 22,
            backgroundColor: 'white',
            overflow: 'hidden',
          }}
          onPress={() => {}}
        >
          {post?.image_url ? <Image source={{ uri: post.image_url }} style={{ width: '100%', height: 360, backgroundColor: '#E5E7EB' }} resizeMode="cover" /> : null}

          <View style={{ padding: 14 }}>
            {editable ? (
              <>
                <Text className="text-[13px] font-extrabold text-gray-900">Descrição</Text>
                <View className="mt-2 rounded-2xl bg-gray-100 px-4 py-3">
                  <TextInput
                    value={caption}
                    onChangeText={setCaption}
                    placeholder="Escreva uma descrição..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    className="min-h-[74px] text-[12px] leading-5 text-gray-700"
                  />
                </View>

                <Text className="mt-3 text-[13px] font-extrabold text-gray-900">Destaque (opcional)</Text>
                <View className="mt-2 rounded-2xl bg-gray-100 px-4 py-3">
                  <TextInput
                    value={highlight}
                    onChangeText={setHighlight}
                    placeholder="Ex: Elegância"
                    placeholderTextColor="#9CA3AF"
                    className="text-[12px] text-gray-700"
                  />
                </View>

                <View className="mt-4 flex-row gap-10 items-center justify-between">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onClose}
                    className="flex-1 h-12 items-center justify-center rounded-full bg-gray-100"
                  >
                    <Text className="text-[13px] font-extrabold text-gray-700">Fechar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={saving}
                    onPress={async () => {
                      try {
                        setSaving(true);
                        await onSave({
                          caption: caption.trim() ? caption.trim() : null,
                          highlight_title: highlight.trim() ? highlight.trim() : null,
                        });
                        onClose();
                      } catch (e: any) {
                        toast.error(e?.message || 'Não foi possível salvar.');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className={`flex-1 h-12 items-center justify-center rounded-full ${saving ? 'bg-brand-cyan/50' : 'bg-brand-cyan'}`}
                  >
                    <Text className="text-[13px] font-extrabold text-white">{saving ? 'Salvando...' : 'Salvar'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text className="text-[13px] font-extrabold text-gray-900">Descrição</Text>
                <Text className="mt-2 text-[12px] leading-5 text-gray-700">{post?.caption ? String(post.caption) : 'Sem descrição.'}</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={onClose} className="mt-5 h-12 items-center justify-center rounded-full bg-gray-100">
                  <Text className="text-[13px] font-extrabold text-gray-700">Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function PortfolioView({ mode, providerId, accentColors }: Props) {
  const colors = accentColors || DEFAULT_ACCENT;
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<ProviderPostRow[]>([]);
  const [tableMissing, setTableMissing] = useState(false);

  const [storyOpen, setStoryOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<StoryGroup | null>(null);

  const [postOpen, setPostOpen] = useState(false);
  const [activePost, setActivePost] = useState<ProviderPostRow | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createUris, setCreateUris] = useState<string[]>([]);
  const [createTitle, setCreateTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const stories = useMemo(() => groupStories(posts), [posts]);

  const load = async () => {
    if (!isSupabaseConfigured) return;
    if (!providerId) return;
    setLoading(true);
    setTableMissing(false);
    try {
      const { data, error } = await supabase
        .from('provider_posts')
        .select('id, provider_id, image_url, caption, highlight_title, post_type, created_at')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(((data || []) as any) as ProviderPostRow[]);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes("Could not find the table 'public.provider_posts'")) {
        setTableMissing(true);
        setPosts([]);
        return;
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  const handleAdd = async () => {
    if (mode !== 'owner') return;
    if (!isSupabaseConfigured) return toast.error('Supabase não configurado.');
    if (!providerId) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return toast.error('Permita o acesso à galeria para adicionar fotos.');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.9,
      });
      if (result.canceled) return;
      const uris = result.assets.map((a) => a.uri).filter(Boolean);
      if (!uris.length) return;

      // Regra do app:
      // - 1 imagem => publicação normal (vai para o grid)
      // - 2+ imagens => estado/destaque em sequência (exige título)
      if (uris.length === 1) {
        toast.loading('Publicando...');
        const up = await uploadPortfolioImageToSupabase({ userId: providerId, uri: uris[0] });
        const { error } = await supabase.from('provider_posts').insert({
          provider_id: providerId,
          image_url: up.publicUrl,
          caption: null,
          highlight_title: null,
          post_type: 'post',
        } as any);
        if (error) throw error;
        toast.success('Publicado!');
        await load();
      } else {
        setCreateUris(uris);
        setCreateTitle('');
        setCreateOpen(true);
        return;
      }
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível publicar.');
    }
  };

  const grid = useMemo(() => posts.filter((p) => (p.post_type || 'post') === 'post'), [posts]);

  if (!isSupabaseConfigured) {
    return (
      <View className="py-10">
        <EmptyState
          icon="images-outline"
          title="Portfólio indisponível"
          description="Configure o Supabase para ver publicações e estados."
        />
      </View>
    );
  }

  if (tableMissing) {
    return (
      <View className="py-10">
        <EmptyState
          icon="alert-circle-outline"
          title="Falta configurar o Portfólio no Supabase"
          description='Crie a tabela "public.provider_posts" e o bucket "portfolio" (veja o SUPABASE_SETUP.md).'
          actionLabel="Tentar novamente"
          onAction={load}
        />
      </View>
    );
  }

  return (
    <View>
      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 18 }} onPress={() => setCreateOpen(false)}>
          <Pressable style={{ marginTop: 160, borderRadius: 22, backgroundColor: 'white', padding: 16 }} onPress={() => {}}>
            <Text className="text-[16px] font-extrabold text-gray-900">Criar Estado (sequência)</Text>
            <Text className="mt-1 text-[12px] text-gray-400">
              Você selecionou {createUris.length} fotos. Dê um título (ex: Natureza).
            </Text>
            <View className="mt-4 rounded-2xl bg-gray-100 px-4 py-3">
              <TextInput
                value={createTitle}
                onChangeText={setCreateTitle}
                placeholder="Título do estado"
                placeholderTextColor="#9CA3AF"
                className="text-[12px] text-gray-700"
              />
            </View>

            <View className="mt-5 flex-row gap-10 items-center justify-between">
              <TouchableOpacity activeOpacity={0.85} onPress={() => setCreateOpen(false)} className="flex-1 h-12 items-center justify-center rounded-full bg-gray-100">
                <Text className="text-[13px] font-extrabold text-gray-700">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={creating}
                onPress={async () => {
                  const title = createTitle.trim();
                  if (!title) return toast.error('Informe um título para o estado.');
                  try {
                    setCreating(true);
                    toast.loading('Publicando estado...');
                    for (const uri of createUris) {
                      const up = await uploadPortfolioImageToSupabase({ userId: providerId, uri });
                      const { error } = await supabase.from('provider_posts').insert({
                        provider_id: providerId,
                        image_url: up.publicUrl,
                        caption: null,
                        highlight_title: title,
                        post_type: 'story',
                      } as any);
                      if (error) throw error;
                    }
                    setCreateOpen(false);
                    setCreateUris([]);
                    setCreateTitle('');
                    toast.success('Estado publicado!');
                    await load();
                  } catch (e: any) {
                    toast.error(e?.message || 'Não foi possível publicar o estado.');
                  } finally {
                    setCreating(false);
                  }
                }}
                className={`flex-1 h-12 items-center justify-center rounded-full ${creating ? 'bg-brand-cyan/50' : 'bg-brand-cyan'}`}
              >
                <Text className="text-[13px] font-extrabold text-white">{creating ? 'Publicando...' : 'Publicar'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <StoryViewer
        open={storyOpen}
        onClose={() => setStoryOpen(false)}
        group={activeStory}
        colors={colors}
      />

      <PostModal
        open={postOpen}
        onClose={() => setPostOpen(false)}
        post={activePost}
        editable={mode === 'owner'}
        onSave={async (patch) => {
          if (!activePost) return;
          const { error } = await supabase
            .from('provider_posts')
            .update(patch as any)
            .eq('id', activePost.id)
            .eq('provider_id', providerId);
          if (error) throw error;
          await load();
        }}
      />

      <View style={{ paddingHorizontal: 2 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingHorizontal: 2, paddingVertical: 8 }}
        >
          {stories.map((s) => (
            <StoryAvatar
              key={s.key}
              title={s.title}
              uri={s.coverUrl}
              colors={colors}
              onPress={() => {
                setActiveStory(s);
                setStoryOpen(true);
              }}
            />
          ))}

          {mode === 'owner' ? (
            <TouchableOpacity activeOpacity={0.85} onPress={handleAdd} className="items-center" style={{ width: 78 }}>
              <View style={{ width: 66, height: 66, borderRadius: 999, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add" size={26} color="#6B7280" />
              </View>
              <Text className="mt-2 text-[11px] text-gray-500" numberOfLines={1}>
                Novo
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>

      <View className="mt-2">
        <FlatList
          key="portfolio-grid-3"
          data={grid}
          keyExtractor={(it) => it.id}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 8 }}
          columnWrapperStyle={{ gap: 2 }}
          ListEmptyComponent={
            loading ? (
              <View className="py-12 items-center justify-center">
                <Text className="text-[12px] font-bold text-gray-500">Carregando...</Text>
              </View>
            ) : (
              <View className="py-10">
                <EmptyState
                  icon="images-outline"
                  title="Sem publicações"
                  description={mode === 'owner' ? 'Publique suas fotos e elas aparecerão aqui.' : 'Este prestador ainda não publicou.'}
                />
              </View>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setActivePost(item);
                setPostOpen(true);
              }}
              style={{ flex: 1, aspectRatio: 1, marginBottom: 2 }}
            >
              <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%', backgroundColor: '#E5E7EB' }} resizeMode="cover" />
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

