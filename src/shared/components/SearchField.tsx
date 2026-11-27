import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useCraveThemeStyles } from '../theme/useCraveTheme';

export interface SearchFieldProps {
  accessibilityLabel: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SearchField({
  accessibilityLabel,
  placeholder,
  value,
  onChangeText,
  onClear,
  style,
}: SearchFieldProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        focused && styles.focused,
        style,
      ]}
    >
      <Feather
        name="search"
        size={18}
        color={focused ? theme.colors.deepOrange : theme.colors.secondaryText}
        accessible={false}
      />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.secondaryText}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={`Clear ${accessibilityLabel.toLowerCase()}`}
          hitSlop={8}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.pressed,
          ]}
        >
          <Feather
            name="x-circle"
            size={20}
            color={theme.colors.secondaryText}
            accessible={false}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(theme: import('../theme/theme').CraveTheme) {
  return StyleSheet.create({
    container: {
      minHeight: 56,
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingLeft: theme.spacing.md,
      paddingRight: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.card,
    },
    focused: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    input: {
      minHeight: 52,
      flex: 1,
      paddingVertical: theme.spacing.sm,
      color: theme.colors.text,
      fontSize: theme.typography.body,
    },
    clearButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.pill,
    },
    pressed: {
      opacity: 0.65,
    },
  });
}
