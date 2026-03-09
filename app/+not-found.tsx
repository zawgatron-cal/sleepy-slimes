import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Link href="/" style={{ padding: 20 }}>
        Go to Home
      </Link>
    </>
  );
}
