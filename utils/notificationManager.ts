
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
 * Check if notification permissions are currently granted
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    console.log('Current notification permission status:', status);
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Existing notification permission status:', existingStatus);
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('Permission request result:', status);
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted. Final status:', finalStatus);
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

    console.log('Notification permissions granted successfully');
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
    console.log('Scheduling noon reminder...');
    
    // Cancel any existing noon reminder first
    await Notifications.cancelScheduledNotificationAsync(NOON_REMINDER_ID);

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
  } catch (error) {
    console.error('Error cancelling noon reminder:', error);
    // Don't throw - cancelling a non-existent notification is fine
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
    return enabled ?? false;
  } catch (error) {
    console.error('Error checking noon reminder status:', error);
    return false;
  }
}

/**
 * Toggle noon reminder on/off
 * Simplified version that just saves the preference and schedules/cancels
 */
export async function toggleNoonReminder(enabled: boolean): Promise<void> {
  console.log('=== TOGGLE NOON REMINDER ===');
  console.log('Requested state:', enabled);
  
  try {
    if (enabled) {
      // Check permissions first
      const hasPermission = await checkNotificationPermissions();
      console.log('Has notification permission:', hasPermission);
      
      if (!hasPermission) {
        // Request permissions
        console.log('Requesting notification permissions...');
        const granted = await requestNotificationPermissions();
        
        if (!granted) {
          console.log('Permission denied - cannot enable reminders');
          // Save disabled state
          await saveNoonReminderEnabled(false);
          throw new Error('PERMISSION_DENIED');
        }
      }
      
      // Schedule the reminder
      console.log('Scheduling reminder...');
      await scheduleNoonReminder();
      
      // Save enabled state
      await saveNoonReminderEnabled(true);
      console.log('Noon reminder enabled successfully');
    } else {
      // Cancel the reminder
      console.log('Cancelling reminder...');
      await cancelNoonReminder();
      
      // Save disabled state
      await saveNoonReminderEnabled(false);
      console.log('Noon reminder disabled successfully');
    }
  } catch (error) {
    console.error('Error in toggleNoonReminder:', error);
    // Make sure we save the correct state even on error
    await saveNoonReminderEnabled(false);
    throw error;
  }
}
