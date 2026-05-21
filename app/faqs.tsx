
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQScreen() {
  const { t } = useTranslation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const itemRefs = useRef<(View | null)[]>([]);

  const faqData: FAQItem[] = Array.from({ length: 13 }, (_, i) => ({
    question: t(`faqs.faqItems.q${i + 1}.question`),
    answer: t(`faqs.faqItems.q${i + 1}.answer`),
  }));

  const toggleExpand = (index: number) => {
    const isOpening = expandedIndex !== index;
    console.log(`[FAQs] FAQ item tapped: index=${index}, action=${isOpening ? 'expand' : 'collapse'}, question="${faqData[index].question}"`);
    setExpandedIndex(isOpening ? index : null);

    if (isOpening) {
      const itemRef = itemRefs.current[index];
      if (itemRef && scrollViewRef.current) {
        itemRef.measure((_x, _y, _width, _height, _pageX, pageY) => {
          console.log(`[FAQs] Scrolling to FAQ item index=${index}, pageY=${pageY}`);
          scrollViewRef.current?.scrollTo({ y: pageY - 80, animated: true });
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('faqs.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== 'ios' && styles.contentContainerWithTabBar,
        ]}
      >
        {faqData.map((faq, index) => (
          <View key={index} ref={(el) => { itemRefs.current[index] = el; }} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.questionContainer}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.question}>{faq.question}</Text>
              <IconSymbol
                ios_icon_name={expandedIndex === index ? 'chevron.up' : 'chevron.down'}
                android_material_icon_name={expandedIndex === index ? 'expand-less' : 'expand-more'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {expandedIndex === index && (
              <View style={styles.answerContainer}>
                <Text style={styles.answer}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  contentContainerWithTabBar: {
    paddingBottom: 100,
  },
  faqItem: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  answer: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
