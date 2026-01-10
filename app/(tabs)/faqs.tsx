
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, commonStyles } from '@/styles/commonStyles';
import AppLogo from '@/components/AppLogo';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'What is Portion Track?',
    answer: 'Portion Track helps you track food using simple portions instead of calories. It is designed to be flexible, realistic and easy to adjust to your goals and dietary preferences.',
  },
  {
    question: 'Do I need to count calories?',
    answer: 'No. Portion Track is designed so you don\'t need to count calories at all.',
  },
  {
    question: 'Where do I log dairy or plant-based dairy?',
    answer: 'Dairy and plant-based dairy count as Protein, Fat, or Carbs depending on type. For example:\n\n• Greek yogurt or cottage cheese = Protein\n• Cheese or cream = Fat\n• Milk or plant-based milk = Carbs logged under Whole Grains',
  },
  {
    question: 'Will Portion Track work with Keto or other diet plans?',
    answer: 'Yes. Portion Track is designed to work with a wide variety of eating styles including keto, low-carb, Mediterranean, plant-based, and more. Because the app focuses on portions and food groups, users can adjust their portion choices to match their preferred approach.',
  },
  {
    question: 'How do I know how much a "portion" is?',
    answer: 'Tap the ⓘ info icon next to each food group to see portion examples and tips.',
  },
  {
    question: 'I forgot to log my food yesterday. What do I do?',
    answer: 'No problem! You can go back and log food, exercise, or weight for up to 7 days prior. Just use the day selector at the top of the screen in Tracking and choose the day you want to update.',
  },
  {
    question: 'How do I log a food that isn\'t listed?',
    answer: 'Choose the food group that best fits the item. You don\'t need perfect matches.',
  },
  {
    question: 'What if a food fits into more than one category?',
    answer: 'Pick the category that best reflects the main component. There is no single right answer.',
  },
  {
    question: 'Do I need to be exact with portions?',
    answer: 'Portion Track works best when it\'s consistent, not perfect. Portions do count and having larger or smaller portions of food items will impact your results.',
  },
  {
    question: 'How does alcohol affect my portions?',
    answer: 'Alcohol impacts the number of whole grain and fat serving targets in your daily calculations for up to 2 per day. Going over 2 will not impact your targets so should be considered in your overall planning and tracking.',
  },
  {
    question: 'Can I change my portions or goals later?',
    answer: 'Yes. You can update your goal and adjust portions at any time in your profile.',
  },
  {
    question: 'When does my day reset?',
    answer: 'The default setting is 12:00 a.m. You can adjust this in settings.',
  },
  {
    question: 'Can Portion Track help with goals like improving cholesterol or blood sugar?',
    answer: 'Portion Track does not diagnose or treat medical conditions. However, many people use portion control and balanced eating to support overall health. Eating consistent portions, choosing healthy options outlined in the app, and focusing on balanced meals can all play a role in supporting healthy blood sugar and cholesterol levels.',
  },
];

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
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AppLogo />
        <Text style={styles.title}>FAQs</Text>
        <Text style={styles.subtitle}>
          Have questions? Portion Track is designed to be simple and flexible! These FAQs cover the most common questions about portions, logging food, and adjusting your plan.
        </Text>
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
