
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '@/styles/commonStyles';

interface PortionDropdownProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  maxValue?: number;
}

const PortionDropdown: React.FC<PortionDropdownProps> = ({
  label,
  value,
  onValueChange,
  maxValue = 10,
}) => {
  const options = Array.from({ length: maxValue + 1 }, (_, i) => i);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={(itemValue) => onValueChange(Number(itemValue))}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          dropdownIconColor={colors.text}
        >
          {options.map((num) => (
            <Picker.Item 
              key={num} 
              label={String(num)} 
              value={num}
              color={colors.text}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  pickerContainer: {
    width: 100,
    height: 44,
    justifyContent: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.background,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: '100%',
    color: colors.text,
  },
  pickerItem: {
    fontSize: 24,
    color: colors.text,
    height: 120,
  },
});

export default PortionDropdown;
