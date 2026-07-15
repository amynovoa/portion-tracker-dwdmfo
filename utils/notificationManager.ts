
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { saveNoonReminderEnabled, loadNoonReminderEnabled, saveReminderTime, loadReminderTime, ReminderTimeConfig } from './storage';
import i18n from '@/utils/i18n';

const NOON_REMINDER_ID = 'noon_reminder';
const NOTIFICATION_CHANNEL_ID = 'daily-reminders';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Set up notification channel for Android
 * MUST be called before requesting permissions on Android 13+
 */
async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      console.log('Setting up Android notification channel...');
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'Daily Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        description: 'Notifications for daily portion tracking reminders',
      });
      console.log('Android notification channel created successfully');
    } catch (error) {
      console.error('Error creating notification channel:', error);
      // Don't throw - channel creation failure shouldn't block the app
    }
  }
}

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
 * Follows best practices: creates channel first on Android 13+
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    console.log('=== REQUESTING NOTIFICATION PERMISSIONS ===');
    
    // Step 1: Create notification channel FIRST (required for Android 13+)
    await setupNotificationChannel();
    
    // Step 2: Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Existing notification permission status:', existingStatus);
    
    let finalStatus = existingStatus;

    // Step 3: Request permissions if not already granted
    if (existingStatus !== 'granted') {
      console.log('Requesting notification permissions from user...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('Permission request result:', status);
    }

    // Step 4: Check final result
    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted. Final status:', finalStatus);
      return false;
    }

    console.log('Notification permissions granted successfully');
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Schedule the daily reminder at the user's chosen time (defaults to noon)
 * if they haven't logged anything yet.
 */
export async function scheduleNoonReminder(): Promise<void> {
  try {
    const { hour, minute } = await loadReminderTime();
    console.log('Scheduling daily reminder at', hour, ':', minute);

    // Cancel any existing reminder first
    await cancelNoonReminder();

    await Notifications.scheduleNotificationAsync({
      identifier: NOON_REMINDER_ID,
      content: {
        title: i18n.t('notifications.reminderTitle'),
        body: i18n.t('notifications.reminderBody'),
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: NOTIFICATION_CHANNEL_ID, // Link to our channel
      },
    });

    console.log('Daily reminder scheduled successfully');
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    throw error;
  }
}

/**
 * Update the reminder time and, if the reminder is currently enabled,
 * reschedule it immediately so the change takes effect right away.
 */
export async function updateReminderTime(config: ReminderTimeConfig): Promise<void> {
  console.log('Updating reminder time:', config);
  await saveReminderTime(config);
  const enabled = await isNoonReminderEnabled();
  if (enabled) {
    await scheduleNoonReminder();
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
 * Follows best practices for permission handling and error management
 */
export async function toggleNoonReminder(enabled: boolean): Promise<void> {
  console.log('=== TOGGLE NOON REMINDER ===');
  console.log('Requested state:', enabled);
  
  try {
    if (enabled) {
      // Step 1: Check if we already have permissions
      let hasPermission = await checkNotificationPermissions();
      console.log('Has notification permission:', hasPermission);
      
      if (!hasPermission) {
        // Step 2: Request permissions (this will also create the channel)
        console.log('Requesting notification permissions...');
        hasPermission = await requestNotificationPermissions();
        
        if (!hasPermission) {
          console.log('Permission denied - cannot enable reminders');
          // Save disabled state
          await saveNoonReminderEnabled(false);
          // Throw specific error for permission denial
          const error = new Error('PERMISSION_DENIED');
          error.name = 'PERMISSION_DENIED';
          throw error;
        }
      } else {
        // Even if we have permissions, ensure channel exists
        await setupNotificationChannel();
      }
      
      // Step 3: Schedule the reminder
      console.log('Scheduling reminder...');
      await scheduleNoonReminder();
      
      // Step 4: Save enabled state
      await saveNoonReminderEnabled(true);
      console.log('Noon reminder enabled successfully');
    } else {
      // Disable: Cancel the reminder and save state
      console.log('Cancelling reminder...');
      await cancelNoonReminder();
      await saveNoonReminderEnabled(false);
      console.log('Noon reminder disabled successfully');
    }
  } catch (error: any) {
    console.error('Error in toggleNoonReminder:', error);
    
    // Always save disabled state on error
    await saveNoonReminderEnabled(false);
    
    // Re-throw the error so the UI can handle it
    throw error;
  }
}

/**
 * Initialize notifications on app startup
 * Creates the notification channel if needed
 */
export async function initializeNotifications(): Promise<void> {
  try {
    console.log('Initializing notifications...');
    await setupNotificationChannel();
    console.log('Notifications initialized successfully');
  } catch (error) {
    console.error('Error initializing notifications:', error);
    // Don't throw - initialization failure shouldn't crash the app
  }
}
