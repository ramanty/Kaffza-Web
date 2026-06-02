import { Stack } from 'expo-router';
import { Colors } from '../../src/constants/colors';

export default function StoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: 'Tajawal_700Bold' },
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
