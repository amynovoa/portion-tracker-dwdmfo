
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { formatDate } from '@/utils/dateUtils';

interface DaySelectorProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export default function DaySelector({ selectedDate, onDateSelect }: DaySelectorProps) {
  // Generate array of dates for the last 7 days
  const getDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push({
        dateString: formatDate(date),
        label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: i === 0,
      });
    }
    
    return dates;
  };

  const dates = getDates();

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((date, index) => {
          const isSelected = date.dateString === selectedDate;
          
          return (
            <TouchableOpacity
              key={date.dateString}
              style={[
                styles.dateButton,
                isSelected && styles.dateButtonSelected,
                index === 0 && styles.firstButton,
                index === dates.length - 1 && styles.lastButton,
              ]}
              onPress={() => onDateSelect(date.dateString)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dateLabel,
                isSelected && styles.dateLabelSelected,
              ]}>
                {date.label}
              </Text>
              {date.isToday && (
                <View style={styles.todayDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  dateButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dateButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  firstButton: {
    marginLeft: 4,
  },
  lastButton: {
    marginRight: 4,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dateLabelSelected: {
    color: '#FFFFFF',
  },
  todayDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});
