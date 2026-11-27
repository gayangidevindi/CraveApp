import { Modal, StyleSheet, Text, View } from 'react-native';

import { CustomButton } from './CustomButton';
import { useCraveThemeStyles } from '../theme/useCraveTheme';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirming?: boolean;
  confirmingLabel?: string;
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  confirming = false,
  confirmingLabel,
}: ConfirmationDialogProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!confirming) {
          onCancel();
        }
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <CustomButton
              title={cancelLabel}
              variant="outline"
              onPress={onCancel}
              disabled={confirming}
              style={styles.actionButton}
            />
            <CustomButton
              title={confirmLabel}
              onPress={onConfirm}
              loading={confirming}
              loadingText={confirmingLabel}
              style={styles.actionButton}
              textStyle={{ color: theme.colors.onPrimary }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: import('../theme/theme').CraveTheme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.overlay,
    },
    card: {
      width: '100%',
      maxWidth: 440,
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.card,
    },
    title: {
      color: theme.colors.heading,
      fontSize: theme.typography.heading,
      fontWeight: theme.typography.weight.bold,
      lineHeight: theme.typography.lineHeight.heading,
    },
    message: {
      color: theme.colors.secondaryText,
      fontSize: theme.typography.body,
      lineHeight: theme.typography.lineHeight.body,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    actionButton: {
      flexGrow: 1,
      flexBasis: 140,
      minHeight: 48,
    },
  });
}
