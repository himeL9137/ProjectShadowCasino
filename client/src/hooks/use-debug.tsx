import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { setDebugMode, toggleDebugMode } from '@/lib/store/slices/debugSlice';

export function useDebug() {
  const debugMode = useAppSelector((state) => state.debug.debugMode);
  const dispatch = useAppDispatch();

  const setDebug = (enabled: boolean) => {
    dispatch(setDebugMode(enabled));
  };

  const toggleDebug = () => {
    dispatch(toggleDebugMode());
  };

  return {
    debugMode,
    setDebugMode: setDebug,
    toggleDebugMode: toggleDebug,
  };
}