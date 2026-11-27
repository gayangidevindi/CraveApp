import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: { username?: string } | undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Favourites: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  RecipeDetails: {
    recipeId: string;
  };
  EditProfile: undefined;
};

export type RootStackParamList = {
  Authentication: NavigatorScreenParams<AuthStackParamList> | undefined;
  Main: NavigatorScreenParams<MainStackParamList> | undefined;
};

export type MainTabScreenProps<RouteName extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, RouteName>,
    NativeStackScreenProps<MainStackParamList>
  >;
