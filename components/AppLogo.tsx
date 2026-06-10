
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface AppLogoProps {
  size?: number;
}

export default function AppLogo({ size = 50 }: AppLogoProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/9b2acb8c-6cd5-475b-8286-4171fe236ec4.png')}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
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
