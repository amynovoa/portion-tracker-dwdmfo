
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import FoodGroupInfoModal from './FoodGroupInfoModal';
import { colors } from '../styles/commonStyles';

interface ExerciseRowProps {
  completed: boolean;
  onToggle: () => void;
}

export default function ExerciseRow({ completed, onToggle }: ExerciseRowProps) {
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const handleInfoPress = () => {
    console.log('Opening exercise info modal');
    setInfoModalVisible(true);
  };

  const exerciseBenefit = `Regular movement supports metabolism, energy, mood, and long-term health. Aim for a mix of cardio and strength training throughout the week.

Even 20–30 minutes counts — you don't need long sessions to benefit.

Aim for 2–4 days per week of resistance training to support lean muscle and metabolism.

Consistency matters more than perfection — every bit of movement helps.`;

  const exerciseAvoid = `Don't overdo it — rest and recovery are just as important as the workout itself.

Avoid exercising through pain or injury.

Don't skip warm-ups or cool-downs.`;

  const exerciseExamples = `Cardio options:
- Brisk walking
- Cycling (indoors or outdoors)
- Swimming
- Elliptical
- Rowing
- Light jogging
- Dance or group fitness classes

Strength/Resistance options:
- Bodyweight exercises (squats, lunges, push-ups, planks)
- Dumbbells or resistance bands
- Machines or cable workouts
- Pilates or reformer
- Functional movements (step-ups, carries, glute bridges)`;

  console.log(`ExerciseRow: completed=${completed}`);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>💪</Text>
          <Text style={styles.label}>Exercise</Text>
          <View style={styles.infoButtonContainer}>
            <TouchableOpacity 
              onPress={handleInfoPress}
              style={styles.infoButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.infoIcon}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.countSpacer}>0/0</Text>
        </View>

        <View style={styles.slotContainer}>
          <TouchableOpacity 
            style={[
              styles.slot,
              completed && styles.slotCompleted,
            ]}
            onPress={onToggle}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.checkmark,
              completed && styles.checkmarkCompleted,
            ]}>
              {completed ? '✓' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FoodGroupInfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        title="Exercise"
        icon="💪"
        benefit={exerciseBenefit}
        avoid={exerciseAvoid}
        examples={exerciseExamples}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  infoButtonContainer: {
    position: 'relative',
    marginRight: 8,
  },
  infoButton: {
    padding: 4,
  },
  infoIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  countSpacer: {
    fontSize: 14,
    fontWeight: '600',
    color: 'transparent',
  },
  slotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  slot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  slotCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    fontSize: 20,
    color: 'transparent',
    fontWeight: '700',
  },
  checkmarkCompleted: {
    color: '#FFFFFF',
  },
});
