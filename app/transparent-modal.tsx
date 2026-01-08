
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';

export default function TransparentModal() {
  const theme = useTheme();
  
  // Ensure we have a solid background color - use white for light mode, dark gray for dark mode
  const modalBackgroundColor = theme.dark ? '#1C1C1E' : '#FFFFFF';

  return (
    <View style={styles.backdrop}>
      <Pressable 
        style={StyleSheet.absoluteFill} 
        onPress={() => router.back()} 
      />
      <View style={[styles.modal, { backgroundColor: modalBackgroundColor }]}>
        <Pressable 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <IconSymbol 
            ios_icon_name="xmark" 
            android_material_icon_name="close" 
            size={24} 
            color={theme.colors.text} 
          />
        </Pressable>
        
        <Text style={[styles.title, { color: theme.colors.text }]}>Portion Tips</Text>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          Tap a portion slot to mark it complete. Track your daily progress here!
        </Text>
        
        <Pressable 
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Got It</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    paddingTop: 48,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
