import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Hook to get the current color scheme (light/dark)
 * Uses React Native's built-in useColorScheme
 */
export function useColorScheme() {
  return useRNColorScheme();
}
