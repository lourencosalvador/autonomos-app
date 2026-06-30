import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { FlatListProps, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// Cast para evitar a fricção de tipos do Animated.FlatList com props genéricas.
const AnimatedFlatList = Animated.FlatList as any;

const THRESHOLD = 80; // distância mínima (px) para disparar o refresh
const MAX_PULL = 170; // arrasto máximo
const REST = 112; // altura mantida enquanto carrega (mostra o indicador inteiro)

type Props = FlatListProps<any> & {
  refreshing: boolean;
  onRefresh: () => void;
  brandColor?: string;
  /** Distância do topo onde o indicador aparece. */
  indicatorTop?: number;
};

/**
 * Pull-to-refresh 100% custom (gesto + Reanimated). Substitui o RefreshControl
 * nativo por um indicador animado: ao arrastar para baixo o spinner cresce e
 * roda com o dedo; ao soltar além do limite, gira sozinho até o refresh acabar.
 */
export function PullToRefresh({
  refreshing,
  onRefresh,
  brandColor = '#00E7FF',
  indicatorTop = 70,
  ...listProps
}: Props) {
  const translateY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const spin = useSharedValue(0);
  const pulse = useSharedValue(1);
  const isRefreshing = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  // Reage ao estado externo de "refreshing" (gira em loop / volta ao repouso).
  useEffect(() => {
    isRefreshing.value = refreshing;
    if (refreshing) {
      translateY.value = withTiming(REST, { duration: 220 });
      spin.value = 0;
      spin.value = withRepeat(withTiming(360, { duration: 750, easing: Easing.linear }), -1);
      pulse.value = withRepeat(
        withSequence(withTiming(1.12, { duration: 380 }), withTiming(1, { duration: 380 })),
        -1
      );
    } else {
      cancelAnimation(spin);
      cancelAnimation(pulse);
      spin.value = withTiming(0, { duration: 150 });
      pulse.value = withTiming(1, { duration: 150 });
      translateY.value = withTiming(0, { duration: 320 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (isRefreshing.value) return;
      // Só "puxa" quando a lista está no topo e o movimento é para baixo.
      if (scrollY.value <= 0 && e.translationY > 0) {
        translateY.value = Math.min(MAX_PULL, e.translationY * 0.55);
      }
    })
    .onEnd(() => {
      if (isRefreshing.value) return;
      if (translateY.value >= THRESHOLD) {
        translateY.value = withTiming(REST, { duration: 200 });
        runOnJS(onRefresh)();
      } else {
        translateY.value = withTiming(0, { duration: 250 });
      }
    });

  // Roda em simultâneo com o scroll nativo da FlatList.
  const composed = Gesture.Simultaneous(pan, Gesture.Native());

  const listStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Container do indicador: opacidade, deslize e escala.
  const indicatorStyle = useAnimatedStyle(() => {
    const progress = interpolate(translateY.value, [0, THRESHOLD], [0, 1], Extrapolation.CLAMP);
    const pullScale = interpolate(translateY.value, [0, THRESHOLD], [0.3, 1], Extrapolation.CLAMP);
    const driftY = interpolate(translateY.value, [0, MAX_PULL], [0, 26], Extrapolation.CLAMP);
    return {
      opacity: isRefreshing.value ? 1 : progress,
      transform: [{ translateY: driftY }, { scale: isRefreshing.value ? pulse.value : pullScale }],
    };
  });

  // Arco/spinner: roda com o dedo enquanto puxa, e em loop durante o refresh.
  const arcStyle = useAnimatedStyle(() => {
    const pullRotate = interpolate(translateY.value, [0, MAX_PULL], [0, 320], Extrapolation.CLAMP);
    return {
      transform: [{ rotate: `${isRefreshing.value ? spin.value : pullRotate}deg` }],
    };
  });

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', top: indicatorTop, left: 0, right: 0, alignItems: 'center', zIndex: 1 },
          indicatorStyle,
        ]}
      >
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: brandColor,
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 3.5,
                borderColor: brandColor,
                borderTopColor: 'transparent',
                borderRightColor: 'transparent',
              },
              arcStyle,
            ]}
          />
          <Ionicons name="flash" size={16} color={brandColor} />
        </View>
      </Animated.View>

      <GestureDetector gesture={composed}>
        <AnimatedFlatList
          {...listProps}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          bounces={false}
          overScrollMode="never"
          style={[{ flex: 1 }, listStyle, listProps.style as any]}
        />
      </GestureDetector>
    </View>
  );
}
