
# Backup & Restore System Guide

## Overview

Your Portion Tracker app now has a comprehensive backup and restore system to protect your data from loss. This system was implemented to prevent the 6-day rebuild situation from happening again.

## Features

### 1. **Automatic Backups**
- Backups are created automatically when you:
  - Launch the app
  - Return to the app from background
- Up to 10 automatic backups are stored locally
- No user action required

### 2. **Manual Backups**
- Create backups on-demand from the Backup & Restore screen
- Useful before making major changes or testing new features
- Instant backup creation

### 3. **Export & Import**
- **Export**: Save backup files to your device
  - iOS: Share to Files app, iCloud Drive, or other apps
  - Android: Save to Downloads or share to Google Drive
  - Web: Downloads as JSON file
- **Import**: Restore from previously exported backup files
- Keep backup files in multiple locations for safety

### 4. **Backup History**
- View your last 10 backups
- See backup date, time, and size
- Restore from any previous backup
- Delete old backups to free space

### 5. **Data Validation**
- All backups are validated before restore
- Prevents corrupted data from breaking your app
- Clear error messages if backup is invalid

## What Gets Backed Up

The backup system saves ALL your app data:

- ✅ User profile (sex, weight, goals, targets)
- ✅ All daily portion tracking data
- ✅ Weight entry history
- ✅ Daily reset time settings
- ✅ App preferences and settings

## How to Use

### Access Backup & Restore
1. Open the app
2. Tap the "More" tab at the bottom
3. Tap "Backup & Restore"

### Create a Manual Backup
1. Go to Backup & Restore screen
2. Tap "Create Backup Now"
3. Backup is saved automatically

### Export a Backup (RECOMMENDED)
1. Go to Backup & Restore screen
2. Tap "Export Backup File"
3. Choose where to save:
   - **iOS**: Save to Files app → iCloud Drive
   - **Android**: Save to Google Drive or Downloads
   - **Web**: File downloads to your computer
4. Keep this file safe!

### Import/Restore a Backup
1. Go to Backup & Restore screen
2. Tap "Import Backup File"
3. Select your backup JSON file
4. Confirm the restore
5. Restart the app

### Restore from History
1. Go to Backup & Restore screen
2. Scroll to "Backup History"
3. Find the backup you want to restore
4. Tap the restore icon (↻)
5. Confirm the restore
6. Restart the app

## Best Practices

### 🛡️ Protection Strategy

1. **Weekly Exports**
   - Export a backup file once per week
   - Save to cloud storage (iCloud, Google Drive, Dropbox)

2. **Before Major Changes**
   - Create a backup before:
     - Updating the app
     - Changing your profile settings
     - Resetting data
     - Testing new features

3. **Multiple Locations**
   - Keep backup files in 2-3 places:
     - Cloud storage (iCloud/Google Drive)
     - Email to yourself
     - Save to computer

4. **Test Restores**
   - Occasionally test restoring from a backup
   - Ensures your backups are working correctly

### ⚠️ Important Notes

- **Local backups are deleted if you uninstall the app**
  - Always export important backups to external storage
  
- **Restoring replaces ALL current data**
  - Create a backup before restoring
  - This action cannot be undone

- **Backup files are JSON format**
  - Human-readable text format
  - Can be opened in any text editor
  - Easy to verify contents

## Backup File Format

Backup files are named: `portion-tracker-backup-YYYY-MM-DD.json`

Example: `portion-tracker-backup-2024-01-15.json`

The file contains:
```json
{
  "version": "1.0.1",
  "timestamp": 1705334400000,
  "profile": { ... },
  "weightEntries": [ ... ],
  "dailyPortions": [ ... ],
  "resetTime": { ... },
  "lastResetDate": "2024-01-15",
  "infoHintSeen": true
}
```

## Troubleshooting

### "Failed to create backup"
- Check available storage space
- Restart the app and try again

### "Failed to export backup"
- Ensure you have storage permissions
- Check available storage space
- Try a different save location

### "Invalid backup file"
- File may be corrupted
- Try a different backup file
- Ensure file is complete (not truncated)

### "Failed to restore backup"
- Ensure backup file is valid JSON
- Check file is from Portion Tracker app
- Try creating a new backup first

## Recovery Scenarios

### Scenario 1: App Crashes After Update
1. Uninstall and reinstall the app
2. Go to Backup & Restore
3. Import your most recent backup file
4. All data restored!

### Scenario 2: Accidentally Deleted Data
1. Go to Backup & Restore
2. Check Backup History
3. Restore from backup before deletion
4. Data recovered!

### Scenario 3: Switching Devices
1. On old device: Export backup file
2. Save to cloud storage or email
3. On new device: Install app
4. Import backup file
5. All data transferred!

### Scenario 4: Testing Features
1. Create backup before testing
2. Test new features
3. If something breaks:
   - Restore from backup
   - Everything back to normal

## Technical Details

### Storage Location
- **Local backups**: AsyncStorage (app's private storage)
- **Exported files**: User-selected location
- **Maximum local backups**: 10 (oldest deleted automatically)

### Backup Frequency
- Automatic: On app launch and resume from background
- Manual: Whenever you tap "Create Backup Now"

### Data Integrity
- All backups include version information
- Validation checks before restore
- Prevents corrupted data from being restored

## Support

If you encounter issues with the backup system:

1. Check this guide for troubleshooting steps
2. Ensure you're using the latest app version
3. Try creating a fresh backup
4. Verify backup file is complete and valid JSON

## Summary

The backup system provides multiple layers of protection:

1. ✅ **Automatic backups** - No action needed
2. ✅ **Manual backups** - Create anytime
3. ✅ **Export/Import** - Save externally
4. ✅ **Backup history** - Restore from past backups
5. ✅ **Data validation** - Prevents corruption

**Recommendation**: Export a backup file weekly and save to cloud storage. This ensures you can always recover your data, even if you lose your device or uninstall the app.

---

**Remember**: The best backup is the one you actually have when you need it. Export regularly! 🛡️
