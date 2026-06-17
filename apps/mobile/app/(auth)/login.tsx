import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { requestOtp } from '../../src/lib/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 8) {
      Alert.alert('خطأ', 'يرجى إدخال رقم هاتف صالح');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(trimmed);
      router.push({ pathname: '/(auth)/verify', params: { phone: trimmed } });
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'تسجيل الدخول' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>مرحباً بك في قفزة 👋</Text>
          <Text style={styles.subtitle}>أدخل رقم هاتفك لتلقي رمز التحقق</Text>
          <TextInput
            style={styles.input}
            placeholder="+968 XXXX XXXX"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            textAlign="right"
            value={phone}
            onChangeText={setPhone}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>إرسال رمز التحقق</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.text.primary,
    textAlign: 'right',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Tajawal_400Regular',
    color: Colors.text.secondary,
    textAlign: 'right',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Tajawal_400Regular',
    color: Colors.text.primary,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  button: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontFamily: 'Tajawal_700Bold' },
});
