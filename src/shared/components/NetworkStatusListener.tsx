import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

import { createNetworkStatusHandler } from '../../store/networkStatusHandler';
import { useAppDispatch } from '../../store/hooks';

export function NetworkStatusListener() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const updateNetworkStatus = createNetworkStatusHandler(dispatch);

    const unsubscribe = NetInfo.addEventListener(updateNetworkStatus);
    void NetInfo.fetch().then(updateNetworkStatus).catch((error: unknown) => {
      console.warn('Could not determine network connectivity.', error);
    });

    return unsubscribe;
  }, [dispatch]);

  return null;
}
