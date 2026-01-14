
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as DocumentPicker from 'expo-document-picker';
import {
  createBackup,
  shareBackup,
  importBackupFromJSON,
  getBackupHistory,
  getBackupStats,
  loadBackupFromHistory,
  restoreBackup,
  deleteBackupFromHistory,
  BackupHistoryItem
} from '@/utils/backupManager';

export default function BackupRestoreScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>([]);
  const [stats, setStats] = useState<{
    totalBackups: number;
    lastBackupDate: Date | null;
    totalDataSize: number;
  }>({ totalBackups: 0, lastBackupDate: null, totalDataSize: 0 });

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      const [history, backupStats] = await Promise.all([
        getBackupHistory(),
        getBackupStats()
      ]);
      setBackupHistory(history);
      setStats(backupStats);
    } catch (error) {
      console.error('Error loading backup data:', error);
    }
  };

  const handleCreateBackup = async () => {
    console.log('User tapped Create Backup button');
    setLoading(true);
    try {
      await shareBackup();
      Alert.alert('Success', 'Backup created and ready to save!');
      await loadBackupData();
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('Error', 'Failed to create backup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    console.log('User tapped Restore from File button');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        console.log('User cancelled document picker');
        return;
      }

      const file = result.assets[0];
      console.log('File selected:', file.name);

      Alert.alert(
        'Restore Backup',
        'This will replace all your current data. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              try {
                const response = await fetch(file.uri);
                const jsonString = await response.text();
                await importBackupFromJSON(jsonString);
                Alert.alert('Success', 'Backup restored successfully! Please restart the app.');
                router.replace('/(tabs)/(home)');
              } catch (error) {
                console.error('Error restoring backup:', error);
                Alert.alert('Error', 'Failed to restore backup. Please check the file format.');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to open file picker.');
    }
  };

  const handleRestoreFromHistory = async (item: BackupHistoryItem) => {
    console.log('User tapped restore from history:', item.id);
    Alert.alert(
      'Restore Backup',
      `Restore backup from ${new Date(item.timestamp).toLocaleString()}?\n\nThis will replace all your current data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const backup = await loadBackupFromHistory(item.id);
              if (backup) {
                await restoreBackup(backup);
                Alert.alert('Success', 'Backup restored successfully! Please restart the app.');
                router.replace('/(tabs)/(home)');
              } else {
                Alert.alert('Error', 'Backup data not found.');
              }
            } catch (error) {
              console.error('Error restoring from history:', error);
              Alert.alert('Error', 'Failed to restore backup.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteFromHistory = async (item: BackupHistoryItem) => {
    console.log('User tapped delete from history:', item.id);
    Alert.alert(
      'Delete Backup',
      `Delete backup from ${new Date(item.timestamp).toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBackupFromHistory(item.id);
              await loadBackupData();
              Alert.alert('Success', 'Backup deleted.');
            } catch (error) {
              console.error('Error deleting backup:', error);
              Alert.alert('Error', 'Failed to delete backup.');
            }
          }
        }
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Backup & Restore',
          headerBackTitle: 'Back'
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="shield.checkmark.fill"
            android_material_icon_name="verified-user"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.infoTitle}>Protect Your Data</Text>
          <Text style={styles.infoText}>
            Create regular backups to prevent data loss. Your backups include all portions, weight entries, and settings.
          </Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Backups:</Text>
            <Text style={styles.statValue}>{stats.totalBackups}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Last Backup:</Text>
            <Text style={styles.statValue}>
              {stats.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleDateString() : 'Never'}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Size:</Text>
            <Text style={styles.statValue}>{formatBytes(stats.totalDataSize)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[buttonStyles.primary, loading && styles.buttonDisabled]}
            onPress={handleCreateBackup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="square.and.arrow.down.fill"
                  android_material_icon_name="cloud-download"
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={buttonStyles.primaryText}>Create & Export Backup</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[buttonStyles.secondary, loading && styles.buttonDisabled]}
            onPress={handleRestoreBackup}
            disabled={loading}
          >
            <IconSymbol
              ios_icon_name="square.and.arrow.up.fill"
              android_material_icon_name="cloud-upload"
              size={24}
              color={colors.primary}
            />
            <Text style={buttonStyles.secondaryText}>Restore from File</Text>
          </TouchableOpacity>
        </View>

        {/* Backup History */}
        {backupHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Backup History</Text>
            {backupHistory.map((item, index) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDate}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                  <Text style={styles.historyDetails}>
                    {item.itemCount} items • {formatBytes(item.size)}
                  </Text>
                </View>
                <View style={styles.historyActions}>
                  <TouchableOpacity
                    style={styles.historyButton}
                    onPress={() => handleRestoreFromHistory(item)}
                  >
                    <IconSymbol
                      ios_icon_name="arrow.clockwise"
                      android_material_icon_name="refresh"
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.historyButton}
                    onPress={() => handleDeleteFromHistory(item)}
                  >
                    <IconSymbol
                      ios_icon_name="trash.fill"
                      android_material_icon_name="delete"
                      size={20}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Backup Tips</Text>
          <Text style={styles.tipText}>• Create backups before major changes</Text>
          <Text style={styles.tipText}>• Save backup files to cloud storage (Google Drive, iCloud)</Text>
          <Text style={styles.tipText}>• Keep multiple backup versions</Text>
          <Text style={styles.tipText}>• Test restoring from backups occasionally</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  historyItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  historyDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  historyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsCard: {
    backgroundColor: colors.highlight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },
});
