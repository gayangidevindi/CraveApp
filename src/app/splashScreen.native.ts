import * as SplashScreen from 'expo-splash-screen';

export async function preventNativeSplashAutoHide(): Promise<void> {
  await SplashScreen.preventAutoHideAsync();
}

export function hideNativeSplash(): Promise<void> {
  return SplashScreen.hideAsync();
}
