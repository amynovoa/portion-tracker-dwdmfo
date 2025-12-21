
import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface DailyCompletionCelebrationProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function DailyCompletionCelebration({ visible, onDismiss }: DailyCompletionCelebrationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      glowAnim.setValue(0);

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim, glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent={true}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onDismiss}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glow effect behind star */}
          <Animated.View 
            style={[
              styles.glowContainer,
              {
                opacity: glowOpacity,
              },
            ]}
          >
            <View style={styles.glow} />
          </Animated.View>

          {/* Star icon */}
          <Text style={styles.starIcon}>⭐</Text>

          {/* Message */}
          <Text style={styles.message}>You did it.</Text>
          <Text style={styles.submessage}>Today&apos;s tracking is complete.</Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
    maxWidth: 340,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  glowContainer: {
    position: 'absolute',
    top: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFD700',
    opacity: 0.3,
  },
  starIcon: {
    fontSize: 72,
    marginBottom: 24,
    textAlign: 'center',
  },
  message: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  submessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
