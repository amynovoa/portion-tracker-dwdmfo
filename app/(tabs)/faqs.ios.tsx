
import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles } from '@/styles/commonStyles';
import AppLogo from '@/components/AppLogo';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  faqItem: {
    marginBottom: 24,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  answer: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});

export default function FAQsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <AppLogo />
          <Text style={styles.title}>Frequently Asked Questions</Text>
          <Text style={styles.subtitle}>Everything you need to know about Portion Tracker</Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>What is a portion?</Text>
          <Text style={styles.answer}>
            A portion is a serving size of food from a specific food group. For example, one portion of protein might be 3-4 oz of chicken, fish, or tofu.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>How are my daily targets calculated?</Text>
          <Text style={styles.answer}>
            Your targets are based on your sex, current weight, and goal (lose, maintain, or build muscle). The app assigns you to a size category (Small, Medium, or Large) and adjusts portions accordingly.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>Can I change my targets?</Text>
          <Text style={styles.answer}>
            Yes! Go to your Profile and tap "Edit Targets" to customize your daily portion goals for each food group.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>What is adherence?</Text>
          <Text style={styles.answer}>
            Adherence is the percentage of your target portions that you've completed. It's calculated daily, weekly, and monthly to help you track your consistency.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>When does my daily tracking reset?</Text>
          <Text style={styles.answer}>
            By default, your tracking resets at midnight. You can customize this in Settings under "Daily Reset" if you prefer a different time.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>Can I track past days?</Text>
          <Text style={styles.answer}>
            Yes! Use the day selector at the top of the Track screen to view and edit previous days. Your history is preserved automatically.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>What if I want to track calories or macros?</Text>
          <Text style={styles.answer}>
            Portion Tracker focuses on food groups and portions, not calories or macros. This approach is simpler and helps build sustainable eating habits.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>How do I reset all my data?</Text>
          <Text style={styles.answer}>
            Go to Settings and tap "Reset App Data" at the bottom. This will clear all your data and return you to the welcome screen. Use with caution!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
