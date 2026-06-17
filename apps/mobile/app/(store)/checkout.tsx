import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { Colors } from '../../src/constants/colors';
import { useCartStore } from '../../src/stores/cart';
import { createOrder } from '../../src/lib/api';

const SUCCESS_URL_PATTERN = '/pay/success';
const CANCEL_URL_PATTERN = '/pay/cancel';

export default function CheckoutScreen() {
  const { items, clearCart, totalPrice } = useCartStore();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initCheckout();
  }, []);

  async function initCheckout() {
    try {
      setLoading(true);
      const payload = {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        customerName: '',
        customerPhone: '',
        shippingAddress: '',
      };
      const result = await createOrder('demo', payload);
      if (result?.data?.checkoutUrl) {
        setCheckoutUrl(result.data.checkoutUrl);
      } else {
        setError('لم يتم الحصول على رابط الدفع');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'فشل إنشاء الطلب');
    } finally {
      setLoading(false);
    }
  }

  function handleNavigationChange(navState: WebViewNavigation) {
    const { url } = navState;
    if (url.includes(SUCCESS_URL_PATTERN)) {
      clearCart();
      Alert.alert('🎉 تم الطلب بنجاح!', 'شكراً لك. تم تأكيد طلبك وسيتم تجهيزه قريباً.', [
        { text: 'العودة للرئيسية', onPress: () => router.replace('/') },
      ]);
    } else if (url.includes(CANCEL_URL_PATTERN)) {
      Alert.alert('❌ فشلت عملية الدفع', 'تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى.', [
        { text: 'العودة للسلة', onPress: () => router.back() },
      ]);
    }
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'الدفع' }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>جاري تحضير عملية الدفع...</Text>
        </View>
      </>
    );
  }

  if (error || !checkoutUrl) {
    return (
      <>
        <Stack.Screen options={{ title: 'الدفع' }} />
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'حدث خطأ غير متوقع'}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `الدفع — ${totalPrice().toFixed(3)} ر.ع.` }} />
      <WebView
        source={{ uri: checkoutUrl }}
        onNavigationStateChange={handleNavigationChange}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
        style={styles.webview}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Tajawal_400Regular',
    color: Colors.text.secondary,
  },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorText: {
    fontSize: 16,
    fontFamily: 'Tajawal_400Regular',
    color: '#EF4444',
    textAlign: 'center',
  },
  webview: { flex: 1 },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
