import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../../shared/theme/theme';

interface AuthNoticeProps {
  message: string;
  tone?: 'error' | 'success';
}

export function AuthNotice({ message, tone = 'error' }: AuthNoticeProps) {
  return (
    <View
      style={[styles.container, tone === 'success' && styles.successContainer]}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
    >
      <Feather
        name={tone === 'error' ? 'alert-circle' : 'check-circle'}
        size={18}
        color={tone === 'error' ? theme.colors.deepOrange : theme.colors.darkBrown}
        accessible={false}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.softYellow,
  },
  successContainer: {
    backgroundColor: theme.colors.warmCream,
  },
  message: {
    flex: 1,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.caption,
    lineHeight: theme.typography.lineHeight.body,
  },
});
