import { configureStore } from '@reduxjs/toolkit';

import { mealApi } from '../features/recipes/services/mealApi';
import appReducer from './appSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    [mealApi.reducerPath]: mealApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(mealApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
