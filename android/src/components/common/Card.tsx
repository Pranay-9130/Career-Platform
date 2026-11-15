import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { borderRadius } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'outlined',
}) => {
  const { colors, isDark } = useThemeStore();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.border,
          borderWidth: variant === 'outlined' ? 1 : 0,
          shadowColor: isDark ? '#000000' : '#64748B',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: variant === 'elevated' ? 0.08 : 0.03,
          shadowRadius: 6,
          elevation: variant === 'elevated' ? 3 : 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 12,
  },
});

