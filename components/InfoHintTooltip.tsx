
import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface InfoHintTooltipProps {
  visible: boolean;
  onDismiss: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function InfoHintTooltip({ visible, onDismiss }: InfoHintTooltipProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      // Fade in and slide down
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when not visible
      fadeAnim.setValue(0);
      slideAnim.setValue(-20);
    }
  }, [visible, fadeAnim, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onDismiss}
        >
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.containerWrapper}
            >
              <Animated.View
                style={[
                  styles.container,
                  {
                    transform: [{ translateY: slideAnim }],
                    marginTop: Math.max(insets.top, 20),
                  },
                ]}
              >
                <View style={styles.tooltip}>
                  {/* X Button in top-right corner */}
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={onDismiss}
                    activeOpacity={0.7}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    accessibilityLabel="Close"
                    accessibilityRole="button"
                  >
                    <IconSymbol 
                      ios_icon_name="xmark" 
                      android_material_icon_name="close" 
                      size={22} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>

                  <View style={styles.iconContainer}>
                    <Text style={styles.infoEmoji}>ℹ️</Text>
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.title}>Portion Tips Available</Text>
                    <Text style={styles.text}>
                      Tap the ℹ️ icon next to any food group to see examples and portion sizes.{'\n\n'}More tips can be found in the FAQs.
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.okButton}
                    onPress={onDismiss}
                    activeOpacity={0.7}
                    accessibilityLabel="Got It"
                    accessibilityRole="button"
                  >
                    <Text style={styles.okButtonText}>Got It</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </SafeAreaView>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  containerWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  container: {
    width: '100%',
  },
  tooltip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 48,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  infoEmoji: {
    fontSize: 48,
  },
  textContainer: {
    marginBottom: 20,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  okButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  okButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
