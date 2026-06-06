import React from 'react';
import { View, ViewStyle, ViewProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...rest
}: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = lightColor ?? darkColor ?? (colorScheme === 'dark' ? '#000' : '#fff');

  return (
    <View
      style={[
        { backgroundColor },
        style,
      ]}
      {...rest}
    />
  );
}
