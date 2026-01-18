
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveNoonReminderEnabled, loadNoonReminderEnabled } from './storage';

const NOTIFICATION_PERMISSION_KEY = 'notification_permission_requested';
const NOON_REMINDER_ID = 'noon_reminder';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    // Mark that we've requested permission
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Check if notification permissions have been requested before
 */
export async function hasRequestedPermissions(): Promise<boolean> {
  try {
    const requested = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
    return requested === 'true';
  } catch (error) {
    console.error('Error checking notification permission status:', error);
    return false;
  }
}

/**
 * Schedule a daily reminder at noon if user hasn't logged anything
 */
export async function scheduleNoonReminder(): Promise<void> {
  try {
    // Cancel any existing noon reminder
    await cancelNoonReminder();

    // Schedule new reminder for 12:00 PM daily
    await Notifications.scheduleNotificationAsync({
      identifier: NOON_REMINDER_ID,
      content: {
        title: 'Portion Tracker Reminder',
        body: "Don't forget to track your portions today!",
        sound: true,
      },
      trigger: {
        hour: 12,
        minute: 0,
        repeats: true,
      },
    });

    console.log('Noon reminder scheduled successfully');
    
    // Save the preference to storage
    await saveNoonReminderEnabled(true);
  } catch (error) {
    console.error('Error scheduling noon reminder:', error);
    throw error;
  }
}

/**
 * Cancel the noon reminder
 */
export async function cancelNoonReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(NOON_REMINDER_ID);
    console.log('Noon reminder cancelled');
    
    // Save the preference to storage
    await saveNoonReminderEnabled(false);
  } catch (error) {
    console.error('Error cancelling noon reminder:', error);
  }
}

/**
 * Check if noon reminder is enabled
 * Uses storage as the source of truth for reliability
 */
export async function isNoonReminderEnabled(): Promise<boolean> {
  try {
    // Use storage as the source of truth
    const enabled = await loadNoonReminderEnabled();
    console.log('Noon reminder enabled (from storage):', enabled);
    return enabled;
  } catch (error) {
    console.error('Error checking noon reminder status:', error);
    return false;
  }
}

/**
 * Toggle noon reminder on/off
 */
export async function toggleNoonReminder(enabled: boolean): Promise<void> {
  console.log('Toggling noon reminder to:', enabled);
  
  if (enabled) {
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
      await scheduleNoonReminder();
      console.log('Noon reminder enabled and scheduled');
    } else {
      throw new Error('Notification permission not granted');
    }
  } else {
    await cancelNoonReminder();
    console.log('Noon reminder disabled and cancelled');
  }
}
