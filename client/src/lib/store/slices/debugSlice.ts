import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DebugState {
  debugMode: boolean;
}

const initialState: DebugState = {
  debugMode: false,
};

const debugSlice = createSlice({
  name: 'debug',
  initialState,
  reducers: {
    setDebugMode: (state, action: PayloadAction<boolean>) => {
      state.debugMode = action.payload;
    },
    toggleDebugMode: (state) => {
      state.debugMode = !state.debugMode;
    },
  },
});

export const { setDebugMode, toggleDebugMode } = debugSlice.actions;
export default debugSlice.reducer;