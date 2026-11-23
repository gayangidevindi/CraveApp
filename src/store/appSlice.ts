import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AppStatus = 'initializing' | 'ready';

interface AppState {
  status: AppStatus;
}

const initialState: AppState = {
  status: 'initializing',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setAppStatus(state, action: PayloadAction<AppStatus>) {
      state.status = action.payload;
    },
  },
});

export const { setAppStatus } = appSlice.actions;
export default appSlice.reducer;
