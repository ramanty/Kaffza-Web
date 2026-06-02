import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { verifyOtp } from '../../src/lib/api';
import { setTokens } from '../../src/lib/auth';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    if (!code || code.length < 4) {
      Alert.alert('خطأ', 'يرجى إدخال رمز التحقق');
      return;
    }
    setLoading(true);
    try {
      const data = await verifyOtp(phone!, code);
      await setTokens(data.accessToken, data.refreshToken);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'رمز التحقق غير صحيح');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'التحقق' }} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>أدخل رمز التحقق</Text>
          <Text style={styles.subtitle}>تم إرسال رمز إلى {phone}</Text>
          <TextInput
            style={styles.input}
            placeholder="XXXX"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            textAlign="center"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            editable={!loading}
          />
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerify} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>تأكيد</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  title: { fontSize: 24, fontFamily: 'Tajawal_700Bold', color: Colors.text.primary, textAlign: 'right', marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'Tajawal_400Regular', color: Colors.text.secondary, textAlign: 'right', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 24, fontFamily: 'Tajawal_700Bold', color: Colors.text.primary, backgroundColor: '#F9FAFB', marginBottom: 16, letterSpacing: 8 },
  button: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontFamily: 'Tajawal_700Bold' },
});
