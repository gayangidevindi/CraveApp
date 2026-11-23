import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface NetworkState {
  isOffline: boolean;
}

const initialState: NetworkState = {
  isOffline: false,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    networkStatusChanged(state, action: PayloadAction<boolean>) {
      state.isOffline = action.payload;
    },
  },
});

export const { networkStatusChanged } = networkSlice.actions;
export default networkSlice.reducer;
