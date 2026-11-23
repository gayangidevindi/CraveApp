import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '../theme/theme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

export interface CategoryChipProps {
  label: string;
  selected?: boolean;
  icon?: FeatherIconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function CategoryChip({
  label,
  selected = false,
  icon,
  onPress,
  style,
}: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected, disabled: !onPress }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? (
        <Feather
          name={icon}
          size={16}
          color={theme.colors.darkBrown}
          accessible={false}
        />
      ) : null}
      <Text
        style={styles.label}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
      {selected ? (
        <View style={styles.selectedIndicator}>
          <Feather
            name="check"
            size={12}
            color={theme.colors.darkBrown}
            accessible={false}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 48,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
  },
  selected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  unselected: {
    borderColor: theme.colors.softYellow,
    backgroundColor: theme.colors.softYellow,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  label: {
    flexShrink: 1,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.label,
    fontWeight: theme.typography.weight.semibold,
  },
  selectedIndicator: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.softYellow,
  },
});
