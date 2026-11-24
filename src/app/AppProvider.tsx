import { useEffect, type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { NetworkStatusListener } from '../shared/components/NetworkStatusListener';
import {
  hydrateThemePreference,
} from '../shared/theme/themeSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { store } from '../store/store';
import { hideNativeSplash, preventNativeSplashAutoHide } from './splashScreen';

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <NetworkStatusListener />
      <ThemeBootstrap>{children}</ThemeBootstrap>
    </Provider>
  );
}

void preventNativeSplashAutoHide().catch((error: unknown) => {
  console.warn('Could not hold the native splash screen during theme loading.', error);
});

function ThemeBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((state) => state.theme.hydrated);

  useEffect(() => {
    if (!hydrated) {
      void dispatch(hydrateThemePreference());
    }
  }, [dispatch, hydrated]);

  useEffect(() => {
    if (hydrated) {
      void hideNativeSplash().catch((error: unknown) => {
        console.warn('Could not hide the native splash screen.', error);
      });
    }
  }, [hydrated]);

  if (!hydrated) {
    return null;
  }

  return children;
}
