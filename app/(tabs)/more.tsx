
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface MoreMenuItem {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iosIcon: string;
  route: string;
  description?: string;
}

export default function MoreScreen() {
  const router = useRouter();

  const menuItems: MoreMenuItem[] = [
    {
      title: 'FAQs',
      icon: 'help',
      iosIcon: 'questionmark.circle.fill',
      route: '/(tabs)/faqs',
      description: 'Frequently asked questions',
    },
    {
      title: 'Profile',
      icon: 'person',
      iosIcon: 'person.fill',
      route: '/(tabs)/profile',
      description: 'Manage your profile and goals',
    },
    {
      title: 'Settings',
      icon: 'settings',
      iosIcon: 'gearshape.fill',
      route: '/(tabs)/settings',
      description: 'App settings and preferences',
    },
  ];

  const handleItemPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleItemPress(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <IconSymbol
                  ios_icon_name={item.iosIcon}
                  android_material_icon_name={item.icon}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                )}
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
