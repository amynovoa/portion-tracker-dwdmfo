
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>💪</Text>
          <Text style={styles.label}>Exercise</Text>
          <TouchableOpacity 
            onPress={handleInfoPress}
            style={styles.infoButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.infoIcon}>ℹ️</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, completed && styles.checkboxChecked]}>
            {completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            {completed ? 'Completed today!' : 'Tap to mark as complete'}
          </Text>
        </TouchableOpacity>
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
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 1,
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
  infoButton: {
    marginRight: 8,
    padding: 4,
  },
  infoIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
});
