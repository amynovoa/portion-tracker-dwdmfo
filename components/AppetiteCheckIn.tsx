import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/styles/commonStyles';
import type { Glp1AppetiteAnswer } from '@/utils/storage';

type AppetiteCheckInProps = {
  answer: Glp1AppetiteAnswer | null;
  onSelect: (answer: Glp1AppetiteAnswer) => void;
};

const OPTIONS: Glp1AppetiteAnswer[] = ['low', 'okay', 'hungry'];

export default function AppetiteCheckIn({ answer, onSelect }: AppetiteCheckInProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.question}>{t('glp1.appetiteQuestion')}</Text>
        <View style={styles.buttons}>
          {OPTIONS.map((option) => {
            const selected = answer === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.button, selected && styles.buttonSelected]}
                onPress={() => onSelect(option)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={t(`glp1.appetite.${option}`)}
              >
                <Text style={[styles.buttonText, selected && styles.buttonTextSelected]}>
                  {t(`glp1.appetite.${option}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {answer ? (
          <Text style={styles.message}>{t(`glp1.appetiteMessage.${answer}`)}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  buttonTextSelected: {
    color: '#FFFFFF',
  },
  message: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
