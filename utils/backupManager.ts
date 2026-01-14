
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { 
  loadProfile, 
  loadWeightEntries, 
  getAllDailyPortions,
  loadResetTime,
  loadLastResetDate,
  hasSeenInfoHint,
  saveProfile,
  saveWeightEntry,
  saveDailyPortions,
  saveResetTime,
  saveLastResetDate,
  saveInfoHintSeen
} from './storage';

const BACKUP_HISTORY_KEY = '@portion_tracker_backup_history';
const MAX_BACKUP_HISTORY = 10; // Keep last 10 backups

export interface BackupData {
  version: string;
  timestamp: number;
  profile: any;
  weightEntries: any[];
  dailyPortions: any[];
  resetTime: any;
  lastResetDate: string | null;
  infoHintSeen: boolean;
}

export interface BackupHistoryItem {
  id: string;
  timestamp: number;
  size: number;
  itemCount: number;
}

/**
 * Create a complete backup of all app data
 */
export async function createBackup(): Promise<BackupData> {
  console.log('Creating backup...');
  
  try {
    const [profile, weightEntries, dailyPortions, resetTime, lastResetDate, infoHintSeen] = await Promise.all([
      loadProfile(),
      loadWeightEntries(),
      getAllDailyPortions(),
      loadResetTime(),
      loadLastResetDate(),
      hasSeenInfoHint()
    ]);

    const backup: BackupData = {
      version: '1.0.1',
      timestamp: Date.now(),
      profile,
      weightEntries,
      dailyPortions,
      resetTime,
      lastResetDate,
      infoHintSeen
    };

    console.log('Backup created successfully:', {
      profile: !!profile,
      weightEntries: weightEntries.length,
      dailyPortions: dailyPortions.length
    });

    return backup;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error('Failed to create backup');
  }
}

/**
 * Restore data from a backup
 */
export async function restoreBackup(backup: BackupData): Promise<void> {
  console.log('Restoring backup from:', new Date(backup.timestamp).toISOString());
  
  try {
    // Validate backup data
    if (!backup.version || !backup.timestamp) {
      throw new Error('Invalid backup data');
    }

    // Restore profile
    if (backup.profile) {
      await saveProfile(backup.profile);
      console.log('Profile restored');
    }

    // Restore weight entries
    if (backup.weightEntries && Array.isArray(backup.weightEntries)) {
      for (const entry of backup.weightEntries) {
        await saveWeightEntry(entry);
      }
      console.log('Weight entries restored:', backup.weightEntries.length);
    }

    // Restore daily portions
    if (backup.dailyPortions && Array.isArray(backup.dailyPortions)) {
      for (const portions of backup.dailyPortions) {
        await saveDailyPortions(portions);
      }
      console.log('Daily portions restored:', backup.dailyPortions.length);
    }

    // Restore reset time
    if (backup.resetTime) {
      await saveResetTime(backup.resetTime);
      console.log('Reset time restored');
    }

    // Restore last reset date
    if (backup.lastResetDate) {
      await saveLastResetDate(backup.lastResetDate);
      console.log('Last reset date restored');
    }

    // Restore info hint seen
    if (backup.infoHintSeen) {
      await saveInfoHintSeen();
      console.log('Info hint status restored');
    }

    console.log('Backup restored successfully');
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw new Error('Failed to restore backup');
  }
}

/**
 * Export backup to a JSON file
 */
export async function exportBackupToFile(): Promise<string> {
  console.log('Exporting backup to file...');
  
  try {
    const backup = await createBackup();
    const fileName = `portion-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(backup, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    console.log('Backup exported to:', fileUri);
    return fileUri;
  } catch (error) {
    console.error('Error exporting backup:', error);
    throw new Error('Failed to export backup');
  }
}

/**
 * Share backup file with user
 */
export async function shareBackup(): Promise<void> {
  console.log('Sharing backup file...');
  
  try {
    const fileUri = await exportBackupToFile();
    
    if (Platform.OS === 'web') {
      // For web, download the file
      const backup = await createBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `portion-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      console.log('Backup downloaded on web');
    } else {
      // For native, use sharing
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Save Portion Tracker Backup'
        });
        console.log('Backup shared successfully');
      } else {
        throw new Error('Sharing is not available on this device');
      }
    }
  } catch (error) {
    console.error('Error sharing backup:', error);
    throw error;
  }
}

/**
 * Import backup from JSON string
 */
export async function importBackupFromJSON(jsonString: string): Promise<void> {
  console.log('Importing backup from JSON...');
  
  try {
    const backup: BackupData = JSON.parse(jsonString);
    await restoreBackup(backup);
    console.log('Backup imported successfully');
  } catch (error) {
    console.error('Error importing backup:', error);
    throw new Error('Failed to import backup. Please check the file format.');
  }
}

/**
 * Save backup to history
 */
export async function saveBackupToHistory(backup: BackupData): Promise<void> {
  console.log('Saving backup to history...');
  
  try {
    const history = await getBackupHistory();
    
    const historyItem: BackupHistoryItem = {
      id: `backup_${backup.timestamp}`,
      timestamp: backup.timestamp,
      size: JSON.stringify(backup).length,
      itemCount: (backup.dailyPortions?.length || 0) + (backup.weightEntries?.length || 0)
    };

    // Add to history
    history.unshift(historyItem);

    // Keep only last MAX_BACKUP_HISTORY items
    const trimmedHistory = history.slice(0, MAX_BACKUP_HISTORY);

    // Save history
    await AsyncStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(trimmedHistory));

    // Save the actual backup data
    await AsyncStorage.setItem(historyItem.id, JSON.stringify(backup));

    console.log('Backup saved to history:', historyItem.id);
  } catch (error) {
    console.error('Error saving backup to history:', error);
  }
}

/**
 * Get backup history
 */
export async function getBackupHistory(): Promise<BackupHistoryItem[]> {
  try {
    const data = await AsyncStorage.getItem(BACKUP_HISTORY_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading backup history:', error);
  }
  return [];
}

/**
 * Load a specific backup from history
 */
export async function loadBackupFromHistory(backupId: string): Promise<BackupData | null> {
  try {
    const data = await AsyncStorage.getItem(backupId);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading backup from history:', error);
  }
  return null;
}

/**
 * Delete a backup from history
 */
export async function deleteBackupFromHistory(backupId: string): Promise<void> {
  try {
    const history = await getBackupHistory();
    const updatedHistory = history.filter(item => item.id !== backupId);
    
    await AsyncStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(updatedHistory));
    await AsyncStorage.removeItem(backupId);
    
    console.log('Backup deleted from history:', backupId);
  } catch (error) {
    console.error('Error deleting backup from history:', error);
  }
}

/**
 * Create automatic backup (called periodically)
 */
export async function createAutomaticBackup(): Promise<void> {
  console.log('Creating automatic backup...');
  
  try {
    const backup = await createBackup();
    await saveBackupToHistory(backup);
    console.log('Automatic backup created successfully');
  } catch (error) {
    console.error('Error creating automatic backup:', error);
  }
}

/**
 * Validate backup data integrity
 */
export function validateBackup(backup: BackupData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!backup.version) {
    errors.push('Missing version information');
  }

  if (!backup.timestamp || typeof backup.timestamp !== 'number') {
    errors.push('Invalid timestamp');
  }

  if (backup.dailyPortions && !Array.isArray(backup.dailyPortions)) {
    errors.push('Invalid daily portions data');
  }

  if (backup.weightEntries && !Array.isArray(backup.weightEntries)) {
    errors.push('Invalid weight entries data');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get backup statistics
 */
export async function getBackupStats(): Promise<{
  totalBackups: number;
  lastBackupDate: Date | null;
  totalDataSize: number;
}> {
  try {
    const history = await getBackupHistory();
    
    return {
      totalBackups: history.length,
      lastBackupDate: history.length > 0 ? new Date(history[0].timestamp) : null,
      totalDataSize: history.reduce((sum, item) => sum + item.size, 0)
    };
  } catch (error) {
    console.error('Error getting backup stats:', error);
    return {
      totalBackups: 0,
      lastBackupDate: null,
      totalDataSize: 0
    };
  }
}
