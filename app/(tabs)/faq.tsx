
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import AppLogo from '@/components/AppLogo';
import { IconSymbol } from '@/components/IconSymbol';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'What is Portion Track?',
    answer: 'Portion Track helps you track food using simple portions instead of calories. It\'s designed to be flexible, realistic, and easy to adjust to your body and your goals.',
  },
  {
    question: 'Do I need to count calories?',
    answer: 'No. Portion Track is designed so you don\'t need to count calories at all.',
  },
  {
    question: 'Where do I log dairy or plant-based dairy?',
    answer: 'Dairy and plant-based dairy are counted as Protein, Fat, or Carbs depending on type.\n\nFor example:\n\n- Greek yogurt or cottage cheese → Protein\n- Cheese or cream → Fat\n- Milk or plant-based milk → Carbs',
  },
  {
    question: 'How do I know how much a "portion" is?',
    answer: 'Tap the ⓘ info icon next to each food group to see portion examples and tips. You don\'t need to be exact — consistency matters more than precision.',
  },
  {
    question: 'I\'m following the weight-loss portions but not losing weight. What should I do?',
    answer: 'If progress stalls after a few weeks:\n\n- Review alcohol intake\n- Check portion sizes (especially carbs, fats, and alcohol)\n- Consider reducing portions of carbs, fat, or protein\n- Make sure you are drinking enough water\n- Make sure movement and sleep are consistent\n\nSmall adjustments can make a big difference.',
  },
  {
    question: 'I think my protein portions are too high. Can I lower them?',
    answer: 'Yes. Portions are adjustable by design. If protein feels excessive or crowds out other foods, reduce by 1 portion and reassess after 1–2 weeks.',
  },
  {
    question: 'How do I log a food that isn\'t listed?',
    answer: 'Choose the food group that best fits the item and log the portion manually. You don\'t need perfect matches.',
  },
  {
    question: 'What if a food fits into more than one category?',
    answer: 'Pick the category that best reflects the main component. There\'s no single "right" answer.',
  },
  {
    question: 'Do I need to be exact with portions?',
    answer: 'No. Portion Track works best when it\'s consistent, not perfect. Portion sizes still matter, especially if progress stalls.',
  },
  {
    question: 'How does alcohol affect my portions?',
    answer: 'Alcohol replaces carb and fat portions in your daily calculations.',
  },
  {
    question: 'Can I change my portions or goals later?',
    answer: 'Yes. You can update your goal and adjust portions at any time in your profile.',
  },
  {
    question: 'When does my day reset?',
    answer: 'Your day resets at the time you choose in Settings. This is helpful for night-shift workers or late eaters. The default setting is 12:00 a.m.',
  },
  {
    question: 'What happens if I go over my portions one day?',
    answer: 'Nothing breaks. One day doesn\'t define progress — patterns do. You can optionally adjust your portions the next day if you choose.',
  },
  {
    question: 'Can Portion Track help with goals like improving cholesterol or blood sugar?',
    answer: 'Portion Track does not diagnose or treat medical conditions. However, many people use portion control and balanced eating to support overall health. Eating consistent portions, limiting excess carbs and fats, reducing alcohol, and focusing on balanced meals can all play a role in supporting healthy cholesterol and blood sugar levels.\n\nIf you have specific medical concerns, always follow the guidance of your healthcare provider.',
  },
];

export default function FAQScreen() {
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({});

  const toggleItem = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <AppLogo size={60} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>FAQs</Text>
          <Text style={styles.subtitle}>Have questions?</Text>
          <Text style={styles.description}>
            Portion Track is designed to be simple and flexible, but it&apos;s normal to need a little guidance as you get started. These FAQs cover the most common questions about portions, logging food, and adjusting your plan.
          </Text>
        </View>

        <View style={styles.faqList}>
          {faqData.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.questionContainer}
                onPress={() => toggleItem(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.questionText}>{item.question}</Text>
                <IconSymbol
                  ios_icon_name={expandedItems[index] ? "chevron.up" : "chevron.down"}
                  android_material_icon_name={expandedItems[index] ? "expand_less" : "expand_more"}
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
              
              {expandedItems[index] && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 48,
    paddingBottom: 120,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  faqList: {
    paddingHorizontal: 16,
  },
  faqItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  answerText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginTop: 12,
  },
  bottomPadding: {
    height: 20,
  },
});
