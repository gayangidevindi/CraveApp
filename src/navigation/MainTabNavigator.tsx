import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { FavouritesScreen } from '../features/recipes/screens/FavouritesScreen';
import { HomeScreen } from '../features/recipes/screens/HomeScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import type { MainTabParamList } from './types';
import { useCraveTheme } from '../shared/theme/useCraveTheme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

const Tab = createBottomTabNavigator<MainTabParamList>();
const tabIcons: Record<keyof MainTabParamList, FeatherIconName> = {
  Home: 'home',
  Favourites: 'heart',
  Profile: 'user',
};

export function MainTabNavigator() {
  const theme = useCraveTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.deepOrange,
        tabBarInactiveTintColor: theme.colors.chocolateBrown,
        tabBarLabelStyle: {
          fontSize: theme.typography.caption,
          fontWeight: theme.typography.weight.semibold,
          marginBottom: 1,
          letterSpacing: 0.1,
        },
        tabBarStyle: {
          minHeight: 68,
          paddingTop: theme.spacing.xs,
          paddingBottom: theme.spacing.sm,
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          minHeight: 56,
        },
        tabBarIcon: ({ color, focused }) => (
          <View
            style={{
              minWidth: 44,
              minHeight: 32,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Feather
              name={tabIcons[route.name]}
              color={color}
              size={22}
              accessible={false}
            />
            <View
              style={{
                width: focused ? 14 : 4,
                height: 3,
                borderRadius: theme.radius.pill,
                backgroundColor: focused
                  ? theme.colors.primary
                  : 'transparent',
              }}
            />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favourites" component={FavouritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
