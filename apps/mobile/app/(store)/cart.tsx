import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { useCartStore, type CartItem } from '../../src/stores/cart';

export default function CartScreen() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCartStore();

  function handleCheckout() {
    if (items.length === 0) {
      Alert.alert('السلة فارغة', 'أضف منتجات قبل المتابعة');
      return;
    }
    router.push('/(store)/checkout');
  }

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product.nameAr}</Text>
        <Text style={styles.itemPrice}>{(item.product.price * item.quantity).toFixed(3)} ر.ع.</Text>
      </View>
      <View style={styles.quantityRow}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeItem(item.product.id)}>
          <Text style={styles.removeText}>حذف</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'السلة 🛒' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>السلة فارغة</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(i) => String(i.product.id)}
              contentContainerStyle={styles.list}
            />
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>الإجمالي:</Text>
                <Text style={styles.totalValue}>{totalPrice().toFixed(3)} ر.ع.</Text>
              </View>
              <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                <Text style={styles.checkoutBtnText}>تأكيد الطلب والدفع</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
                <Text style={styles.clearBtnText}>تفريغ السلة</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  itemRow: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  itemInfo: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
  itemName: {
    fontSize: 16,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.text.primary,
    textAlign: 'right',
  },
  itemPrice: { fontSize: 16, fontFamily: 'Tajawal_700Bold', color: Colors.primary },
  quantityRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  qtyText: {
    fontSize: 16,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.text.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  removeText: { fontSize: 13, fontFamily: 'Tajawal_500Medium', color: '#EF4444' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: Colors.surface,
  },
  totalRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 18, fontFamily: 'Tajawal_700Bold', color: Colors.text.primary },
  totalValue: { fontSize: 18, fontFamily: 'Tajawal_700Bold', color: Colors.primary },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Tajawal_700Bold' },
  clearBtn: { padding: 12, alignItems: 'center' },
  clearBtnText: { color: '#EF4444', fontSize: 14, fontFamily: 'Tajawal_500Medium' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontFamily: 'Tajawal_400Regular', color: Colors.text.muted },
});
