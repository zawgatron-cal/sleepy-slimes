import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { labTheme } from '@/src/slime-lab/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Screen not found</Text>
        <Link href="/" style={styles.link}>
          Back to Slime Lab
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: labTheme.background,
  },
  title: {
    fontSize: 18,
    color: labTheme.text,
  },
  link: {
    marginTop: 12,
    fontSize: 16,
    color: labTheme.accent,
  },
});
