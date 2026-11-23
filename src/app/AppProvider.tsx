import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { NetworkStatusListener } from '../shared/components/NetworkStatusListener';
import { store } from '../store/store';

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <NetworkStatusListener />
      {children}
    </Provider>
  );
}
