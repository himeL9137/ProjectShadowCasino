import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DebugSettings {
  disableAnimations: boolean;
  disableGradients: boolean;
  disableShadows: boolean;
  disableBlurEffects: boolean;
  disableHoverEffects: boolean;
  simplifyBorders: boolean;
  reducedMotion: boolean;
  lowQualityImages: boolean;
  disableParticles: boolean;
  performanceMode: 'off' | 'balanced' | 'maximum';
}

interface DebugMetrics {
  renderCount: number;
  lastToggleTime: number;
  performanceGain: number;
  memoryUsage: number;
}

interface DebugState {
  debugMode: boolean;
  settings: DebugSettings;
  metrics: DebugMetrics;
  isInitialized: boolean;
}

const defaultSettings: DebugSettings = {
  disableAnimations: true,
  disableGradients: true,
  disableShadows: true,
  disableBlurEffects: true,
  disableHoverEffects: true,
  simplifyBorders: true,
  reducedMotion: true,
  lowQualityImages: false,
  disableParticles: true,
  performanceMode: 'maximum'
};

const initialState: DebugState = {
  debugMode: false,
  settings: defaultSettings,
  metrics: {
    renderCount: 0,
    lastToggleTime: 0,
    performanceGain: 0,
    memoryUsage: 0
  },
  isInitialized: false
};

const debugSlice = createSlice({
  name: 'debug',
  initialState,
  reducers: {
    setDebugMode: (state, action: PayloadAction<boolean>) => {
      state.debugMode = action.payload;
      state.metrics.lastToggleTime = Date.now();
      state.metrics.renderCount += 1;
    },
    toggleDebugMode: (state) => {
      state.debugMode = !state.debugMode;
      state.metrics.lastToggleTime = Date.now();
      state.metrics.renderCount += 1;
    },
    updateDebugSettings: (state, action: PayloadAction<Partial<DebugSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setPerformanceMode: (state, action: PayloadAction<'off' | 'balanced' | 'maximum'>) => {
      const mode = action.payload;
      state.settings.performanceMode = mode;
      
      if (mode === 'maximum') {
        state.settings = { ...defaultSettings, performanceMode: 'maximum' };
      } else if (mode === 'balanced') {
        state.settings = {
          ...defaultSettings,
          performanceMode: 'balanced',
          disableGradients: false,
          disableShadows: false,
          lowQualityImages: true
        };
      } else {
        state.settings = {
          ...defaultSettings,
          performanceMode: 'off',
          disableAnimations: false,
          disableGradients: false,
          disableShadows: false,
          disableBlurEffects: false,
          disableHoverEffects: false,
          simplifyBorders: false,
          reducedMotion: false,
          disableParticles: false
        };
      }
    },
    updatePerformanceMetrics: (state, action: PayloadAction<{ gain: number; memory: number }>) => {
      state.metrics.performanceGain = action.payload.gain;
      state.metrics.memoryUsage = action.payload.memory;
    },
    initializeDebugMode: (state) => {
      state.isInitialized = true;
    }
  },
});

export const { 
  setDebugMode, 
  toggleDebugMode, 
  updateDebugSettings, 
  setPerformanceMode,
  updatePerformanceMetrics,
  initializeDebugMode
} = debugSlice.actions;

export default debugSlice.reducer;