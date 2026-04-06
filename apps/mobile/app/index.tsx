// ============================================
// Kaffza (قفزة) — Customer Home Screen
// ============================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { IProduct } from '@kaffza/types';
import { ProductCard } from '../src/components/ProductCard';
import { Colors } from '../src/constants/colors';
import { MOCK_PRODUCTS, fetchProducts } from '../src/lib/api';

const NUM_COLUMNS = 2;

export default function HomeScreen() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();
      setProducts(data.filter((p) => p.isActive));
    } catch {
      // Fallback to mock data when API is not reachable
      setProducts(MOCK_PRODUCTS);
      setError('تعذّر الاتصال بالخادم — يتم عرض بيانات تجريبية');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddToCart = useCallback((product: IProduct) => {
    setCartCount((prev) => prev + 1);
    Alert.alert(
      'تمت الإضافة! 🛒',
      `تمت إضافة "${product.nameAr}" إلى السلة`,
      [{ text: 'حسناً' }],
    );
  }, []);

  const renderProduct = useCallback(
    ({ item }: { item: IProduct }) => (
      <ProductCard product={item} onAddToCart={handleAddToCart} />
    ),
    [handleAddToCart],
  );

  const keyExtractor = useCallback((item: IProduct) => String(item.id), []);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'قفزة | Kaffza',
          headerRight: () => (
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() =>
                Alert.alert('قريباً', 'شاشة السلة قيد التطوير في المرحلة القادمة')
              }
              accessibilityLabel={`السلة — ${cartCount} عنصر`}
              accessibilityRole="button"
            >
              <Text style={styles.cartIcon}>🛒</Text>
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>أهلاً بك في قفزة 👋</Text>
          <Text style={styles.bannerSubtitle}>اكتشف أفضل المنتجات بأسعار مميزة</Text>
        </View>

        {/* Offline / error notice */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Products */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>جاري تحميل المنتجات…</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={keyExtractor}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>لا توجد منتجات متاحة حالياً</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  banner: {
    backgroundColor: Colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  bannerTitle: {
    fontSize: 22,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.text.inverse,
    textAlign: 'right',
  },
  bannerSubtitle: {
    fontSize: 14,
    fontFamily: 'Tajawal_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  errorText: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'right',
    fontFamily: 'Tajawal_400Regular',
  },
  grid: {
    padding: 10,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.text.secondary,
    fontFamily: 'Tajawal_400Regular',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.muted,
    fontFamily: 'Tajawal_400Regular',
  },
  cartButton: {
    marginLeft: 16,
    position: 'relative',
  },
  cartIcon: {
    fontSize: 22,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: Colors.premium,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
});
