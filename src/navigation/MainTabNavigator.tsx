import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';

import { FavouritesScreen } from '../features/recipes/screens/FavouritesScreen';
import { HomeScreen } from '../features/recipes/screens/HomeScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import type { MainTabParamList } from './types';
import { theme } from '../shared/theme/theme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

const Tab = createBottomTabNavigator<MainTabParamList>();
const tabIcons: Record<keyof MainTabParamList, FeatherIconName> = {
  Home: 'home',
  Favourites: 'heart',
  Profile: 'user',
};

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.deepOrange,
        tabBarInactiveTintColor: theme.colors.chocolateBrown,
        tabBarLabelStyle: {
          fontSize: theme.typography.caption,
          fontWeight: theme.typography.weight.semibold,
          marginBottom: 2,
        },
        tabBarStyle: {
          minHeight: 60,
          paddingTop: theme.spacing.xs,
          paddingBottom: theme.spacing.xs,
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.softYellow,
        },
        tabBarIcon: ({ color, size }) => (
          <Feather
            name={tabIcons[route.name]}
            color={color}
            size={size}
            accessible={false}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favourites" component={FavouritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
