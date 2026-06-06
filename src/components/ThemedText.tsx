import React from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const color = lightColor ?? darkColor ?? (colorScheme === 'dark' ? '#fff' : '#000');

  const getTypeStyle = (): TextStyle => {
    switch (type) {
      case 'title':
        return { fontSize: 28, fontWeight: 'bold', lineHeight: 36 };
      case 'subtitle':
        return { fontSize: 20, fontWeight: 'bold', lineHeight: 28 };
      case 'defaultSemiBold':
        return { fontSize: 16, fontWeight: '600', lineHeight: 24 };
      case 'link':
        return { fontSize: 16, lineHeight: 24, color: '#0a7ea4' };
      default:
        return { fontSize: 16, lineHeight: 24 };
    }
  };

  return (
    <Text
      style={[
        { color },
        getTypeStyle(),
        style,
      ]}
      {...rest}
    />
  );
}
