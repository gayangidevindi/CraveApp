import type { AppDispatch } from './store';
import { mealApi } from '../features/recipes/services/mealApi';
import { networkStatusChanged } from './networkSlice';

export interface ConnectivitySnapshot {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

export function createNetworkStatusHandler(
  dispatch: AppDispatch,
): (state: ConnectivitySnapshot) => void {
  let previousOffline: boolean | null = null;

  return (state) => {
    const isOffline =
      state.isConnected === false || state.isInternetReachable === false;

    dispatch(networkStatusChanged(isOffline));

    if (previousOffline === true && !isOffline) {
      dispatch(mealApi.util.invalidateTags(['Meal', 'Category']));
    }

    previousOffline = isOffline;
  };
}
