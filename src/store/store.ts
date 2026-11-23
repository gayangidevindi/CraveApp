import { configureStore } from '@reduxjs/toolkit';

import { mealApi } from '../features/recipes/services/mealApi';
import favouritesReducer from '../features/recipes/state/favouritesSlice';
import profileReducer from '../features/profile/state/profileSlice';
import appReducer from './appSlice';
import authReducer from './authSlice';
import networkReducer from './networkSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    favourites: favouritesReducer,
    profile: profileReducer,
    network: networkReducer,
    [mealApi.reducerPath]: mealApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(mealApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
