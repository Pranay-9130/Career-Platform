import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { typography } from '../../constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
}) => {
  const { colors } = useThemeStore();

  return (
    <View style={styles.container}>
      {icon && <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>{icon}</View>}
      <Text style={[typography.h4, { color: colors.text, marginTop: 12, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textMuted, marginTop: 6, textAlign: 'center', maxWidth: 280 },
        ]}
      >
        {description}
      </Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          size="sm"
          style={{ marginTop: 16 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

