import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface AppLogoProps {
  /** Icon-only mark (default) or full trademark wordmark. */
  variant?: 'icon' | 'wordmark';
  /** Height for wordmark, or width+height for icon. */
  size?: number;
}

const ICON = require('../assets/images/9b2acb8c-6cd5-475b-8286-4171fe236ec4.png');
const WORDMARK = require('../assets/images/portiontrack_logo_wordmark.png');

export default function AppLogo({ variant = 'icon', size = 50 }: AppLogoProps) {
  if (variant === 'wordmark') {
    // Trademark master is square (1024×1024 icon+wordmark lockup).
    const height = size;
    const width = size;
    return (
      <View style={styles.container}>
        <Image
          source={WORDMARK}
          style={{ width, height }}
          resizeMode="contain"
          accessibilityLabel="PortionTrack"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={ICON}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
        accessibilityLabel="PortionTrack"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 50,
    height: 50,
  },
});
