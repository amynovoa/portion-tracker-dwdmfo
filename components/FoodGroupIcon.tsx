import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text } from 'react-native';

type FoodGroupIconProps = {
  icon: string | number | ImageSourcePropType;
  size?: number;
};

export default function FoodGroupIcon({ icon, size = 18 }: FoodGroupIconProps) {
  if (typeof icon === 'string') {
    return <Text style={[styles.emoji, { fontSize: size, lineHeight: size + 4 }]}>{icon}</Text>;
  }

  return (
    <Image
      source={icon as ImageSourcePropType}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center',
  },
});
