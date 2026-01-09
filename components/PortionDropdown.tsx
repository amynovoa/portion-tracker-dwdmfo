
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '@/styles/commonStyles';

interface PortionDropdownProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  maxValue?: number;
}

export default function PortionDropdown({ 
  label, 
  value, 
  onValueChange,
  maxValue = 10 
}: PortionDropdownProps) {
  const options = Array.from({ length: maxValue + 1 }, (_, i) => i);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={(itemValue) => onValueChange(Number(itemValue))}
          style={styles.picker}
        >
          {options.map((num) => (
            <Picker.Item 
              key={num} 
              label={`${num} portion${num !== 1 ? 's' : ''}`} 
              value={num} 
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    backgroundColor: colors.highlight,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
});
