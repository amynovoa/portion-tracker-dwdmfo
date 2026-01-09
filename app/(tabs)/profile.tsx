
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import { Sex, Goal, UserProfile, PortionTargets, ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { Picker } from '@react-native-picker/picker';
import { saveProfile, loadProfile } from '@/utils/storage';
import AppLogo from '@/components/AppLogo';
import { IconSymbol } from '@/components/IconSymbol';

const styles = StyleSheet.create({
  // ... existing styles
  pickerItem: {
    fontSize: 17,
  },
});

// ... rest of the component implementation
