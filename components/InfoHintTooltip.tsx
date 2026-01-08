
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface InfoHintTooltipProps {
  visible: boolean;
  onDismiss: () => void;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InfoHintTooltip({ visible, onDismiss }: InfoHintTooltipProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.containerWrapper}
          >
            <View style={[styles.container, { marginTop: Math.max(insets.top, 20) }]}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onDismiss}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  ios_icon_name="xmark" 
                  android_material_icon_name="close" 
                  size={24} 
                  color={colors.text} 
                />
              </TouchableOpacity>

              <Text style={styles.title}>Portion Tips Available!</Text>
              <Text style={styles.message}>
                Tap the info icon (i) next to any food group to see helpful portion examples and tips.
              </Text>

              <TouchableOpacity 
                style={[buttonStyles.primary, styles.button]}
                onPress={onDismiss}
                activeOpacity={0.8}
              >
                <Text style={buttonStyles.primaryText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
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
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    paddingTop: 56,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
});
