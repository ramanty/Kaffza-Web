// ============================================
// Kaffza (قفزة) — Base UI Components
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewProps,
  type TextProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

// ── Screen ──────────────────────────────────────────────────────────────────

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
}

export function Screen({ children, style, ...props }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

// ── Title ─────────────────────────────────────────────────────────────────────

interface TitleProps extends TextProps {
  children: React.ReactNode;
}

export function Title({ children, style, ...props }: TitleProps) {
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'right',
    marginVertical: 12,
  },
});
