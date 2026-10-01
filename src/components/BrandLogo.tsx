import React from 'react';
import { Image } from 'react-native';

export function BrandLogo({ size = 96 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/branding/piggypath-logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel="PiggyPath logo"
    />
  );
}
