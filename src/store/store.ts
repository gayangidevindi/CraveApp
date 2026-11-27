import { configureStore } from '@reduxjs/toolkit';

import { mealApi } from '../features/recipes/services/mealApi';
import favouritesReducer from '../features/recipes/state/favouritesSlice';
import profileReducer from '../features/profile/state/profileSlice';
import recentlyViewedReducer from '../features/recipes/state/recentlyViewedSlice';
import recipeSyncReducer from '../features/recipes/state/recipeSyncSlice';
import appReducer from './appSlice';
import authReducer from './authSlice';
import networkReducer from './networkSlice';
import themeReducer from '../shared/theme/themeSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    favourites: favouritesReducer,
    profile: profileReducer,
    recentlyViewed: recentlyViewedReducer,
    recipeSync: recipeSyncReducer,
    network: networkReducer,
    theme: themeReducer,
    [mealApi.reducerPath]: mealApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(mealApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
