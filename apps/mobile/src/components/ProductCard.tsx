// ============================================
// Kaffza (قفزة) — ProductCard Component
// ============================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import type { IProduct } from '@kaffza/types';
import { Colors } from '../constants/colors';

interface ProductCardProps {
  product: IProduct;
  onAddToCart: (product: IProduct) => void;
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/200x200/1B3A6B/FFFFFF/png?text=قفزة';

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const imageUri = product.images?.[0] ?? PLACEHOLDER_IMAGE;

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel={product.nameAr}
      />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.nameAr}
        </Text>
        {product.nameEn ? (
          <Text style={styles.nameEn} numberOfLines={1}>
            {product.nameEn}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onAddToCart(product)}
            activeOpacity={0.8}
            accessibilityLabel={`أضف ${product.nameAr} للسلة`}
            accessibilityRole="button"
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
          <Text style={styles.price}>
            {product.price.toFixed(3)}{' '}
            <Text style={styles.currency}>ر.ع</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    flex: 1,
    margin: 6,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.border,
  },
  body: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'right',
    lineHeight: 20,
  },
  nameEn: {
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'right',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  currency: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.text.secondary,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.premium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.inverse,
    lineHeight: 22,
  },
});
