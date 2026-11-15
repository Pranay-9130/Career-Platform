import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { borderRadius, typography } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
  textStyle,
  icon,
}) => {
  const { colors, isDark } = useThemeStore();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: isDark ? '#064E3B' : '#ECFDF5',
          border: isDark ? '#047857' : '#A7F3D0',
          text: isDark ? '#34D399' : '#065F46',
        };
      case 'warning':
        return {
          bg: isDark ? '#78350F' : '#FFFBEB',
          border: isDark ? '#B45309' : '#FDE68A',
          text: isDark ? '#FBBF24' : '#92400E',
        };
      case 'error':
        return {
          bg: isDark ? '#7F1D1D' : '#FEF2F2',
          border: isDark ? '#B91C1C' : '#FECACA',
          text: isDark ? '#F87171' : '#991B1B',
        };
      case 'neutral':
        return {
          bg: isDark ? '#1F2937' : '#F1F5F9',
          border: isDark ? '#374151' : '#E2E8F0',
          text: isDark ? '#94A3B8' : '#475569',
        };
      case 'primary':
      default:
        return {
          bg: isDark ? '#1E3A8A' : '#EFF6FF',
          border: isDark ? '#1D4ED8' : '#BFDBFE',
          text: isDark ? '#93C5FD' : '#1D4ED8',
        };
    }
  };

  const c = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
        },
        style,
      ]}
    >
      {icon}
      <Text style={[typography.tiny, { color: c.text, marginLeft: icon ? 4 : 0 }, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
