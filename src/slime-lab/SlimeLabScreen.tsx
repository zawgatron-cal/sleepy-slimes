import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import useControls from 'r3f-native-orbitcontrols';
import { LabCanvas } from './components/LabCanvas';
import { SlimeScene } from './scenes/SlimeScene';
import { labTheme } from './theme';

export function SlimeLabScreen() {
  const [OrbitControls, events] = useControls();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Slime Lab</Text>
        <Text style={styles.subtitle}>
          React Three Fiber + shaders — custom slime generator WIP
        </Text>
      </View>
      <View style={styles.canvasWrap} {...events}>
        <LabCanvas OrbitControls={OrbitControls}>
          <SlimeScene />
        </LabCanvas>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: labTheme.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: labTheme.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: labTheme.textMuted,
  },
  canvasWrap: {
    flex: 1,
  },
});
