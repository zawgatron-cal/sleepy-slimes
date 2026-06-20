import { useEffect, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { SlimepediaDetailBackground } from '@/src/components/slimepedia/SlimepediaDetailBackground';
import { preloadSlimepediaDetailData } from '@/src/hooks/useSlimepediaDetailData';
import { mainScreens } from '@/src/theme/mainScreensTheme';

function useIsSlimepediaDetailScreen(): boolean {
  const pathname = usePathname();
  return pathname.startsWith('/slimepedia/') && pathname.length > '/slimepedia/'.length;
}

export default function SlimepediaLayout() {
  const { width, height } = useWindowDimensions();
  const isDetailScreen = useIsSlimepediaDetailScreen();
  const [detailBgMounted, setDetailBgMounted] = useState(false);

  useEffect(() => {
    preloadSlimepediaDetailData();
  }, []);

  useEffect(() => {
    if (isDetailScreen) {
      setDetailBgMounted(true);
    }
  }, [isDetailScreen]);

  return (
    <View style={styles.root}>
      {detailBgMounted ? (
        <View style={styles.backgroundLayer} pointerEvents="none">
          <SlimepediaDetailBackground
            width={width}
            height={height}
            visible={isDetailScreen}
          />
        </View>
      ) : null}

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: styles.transparentScreen,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: mainScreens.slimepedia.detail.bg,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  transparentScreen: {
    backgroundColor: 'transparent',
  },
});
