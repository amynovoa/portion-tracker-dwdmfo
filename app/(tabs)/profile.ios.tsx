
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { Sex, Goal, UserProfile, PortionTargets, ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import React, { useState, useEffect, useCallback } from 'react';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { Picker } from '@react-native-picker/picker';
import { saveProfile, loadProfile } from '@/utils/storage';
import { IconSymbol } from '@/components/IconSymbol';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';

const styles = StyleSheet.create({
  // ... existing styles
  pickerItem: {
    fontSize: 17,
  },
});

// ... rest of the component implementation with Picker.Item style={{fontSize: 17}}
