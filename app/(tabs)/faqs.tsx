
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, commonStyles } from '@/styles/commonStyles';
import AppLogo from '@/components/AppLogo';

interface FAQItem {
  question: string;
  answer: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },

  faqItem: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  answerText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

export default function FAQScreen() {
  const { t } = useTranslation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const FAQ_DATA = useMemo<FAQItem[]>(
    () =>
      Array.from({ length: 13 }, (_, i) => ({
        question: t(`faqs.faqItems.q${i + 1}.question`),
        answer: t(`faqs.faqItems.q${i + 1}.answer`),
      })),
    [t]
  );

  const toggleExpand = (index: number) => {
    console.log('[FAQScreen] FAQ item toggled', { index, question: FAQ_DATA[index]?.question });
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const screenTitle = t('faqs.title');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AppLogo />
        <Text style={styles.title}>{screenTitle}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {FAQ_DATA.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.questionContainer}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.questionText}>{faq.question}</Text>
              <MaterialIcons
                name={expandedIndex === index ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
            {expandedIndex === index && (
              <View style={styles.answerContainer}>
                <Text style={styles.answerText}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
