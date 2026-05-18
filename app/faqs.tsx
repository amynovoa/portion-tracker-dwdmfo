
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
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';

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
    answer: "No. Portion Track is designed so you don't need to count calories at all.",
  },
  {
    question: 'Where do I log dairy or plant-based dairy?',
    answer: 'Dairy and plant-based dairy are count as Protein, Fat, or Carbs depending on type. For example:\n\nGreek yogurt or cottage cheese = Protein\nCheese or cream = Fat\nMilk or plant-based milk = Carbs logged under Whole Grains',
  },
  {
    question: 'Will Portion Track work with Keto or other diet plans?',
    answer: 'Yes. Portion Track is designed to work with a wide variety of eating styles including keto, low-carb, Mediterranean, plant-based, and more.\n\nBecause the app focuses on portions and food groups, users can adjust their portion choices to match their preferred approach.',
  },
  {
    question: 'How do I know how much a "portion" is?',
    answer: 'Tap the I info icon next to each food group to see portion examples and tips.',
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

export default function FAQScreen() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const itemRefs = useRef<(View | null)[]>([]);

  const toggleExpand = (index: number) => {
    const isOpening = expandedIndex !== index;
    console.log(`[FAQs] FAQ item tapped: index=${index}, action=${isOpening ? 'expand' : 'collapse'}, question="${FAQ_DATA[index].question}"`);
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
        <Text style={styles.headerTitle}>FAQs</Text>
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
        <Text style={styles.subtitle}>Have questions?</Text>
        <Text style={styles.description}>
          Portion Track is designed to be simple and flexible! These FAQs cover the most common
          questions about portions, logging food, and adjusting your plan.
        </Text>

        {FAQ_DATA.map((faq, index) => (
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
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
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
