
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
            A portion is a serving size of food from a specific food group. For example, one portion of protein might be 3-4 oz of chicken, fish, or tofu. One portion of veggies is about 1 cup raw or 1/2 cup cooked.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>How are my daily targets calculated?</Text>
          <Text style={styles.answer}>
            Your targets are based on your sex, current weight, and goal (lose weight, maintain weight, or build muscle). The app assigns you to a size category (Small, Medium, or Large) behind the scenes and adjusts portions accordingly. For example, if you choose "Lose Weight," the app reduces whole grains and fats while optionally increasing veggies.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>Can I change my targets?</Text>
          <Text style={styles.answer}>
            Yes! Go to your Profile and tap "Edit Targets" to customize your daily portion goals for each food group. You can adjust any number to fit your personal needs.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>What food groups can I track?</Text>
          <Text style={styles.answer}>
            You can track Protein, Veggies, Fruit, Whole Grains, Legumes, Nuts & Seeds, Fats, Water, Alcohol, and Exercise. Each has its own daily target that you can customize.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>How does alcohol tracking work?</Text>
          <Text style={styles.answer}>
            During setup, you can set your daily alcohol goal (the app recommends a maximum of 2 portions per day). One portion equals one standard drink (12 oz beer, 5 oz wine, or 1.5 oz spirits). Track your alcohol intake just like other food groups.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>What about exercise tracking?</Text>
          <Text style={styles.answer}>
            You can track exercise sessions daily by checking them off. Exercise appears in your daily tracking but is not included in portion targets or adherence calculations—it's just a helpful habit tracker.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>What is adherence?</Text>
          <Text style={styles.answer}>
            Adherence is the percentage of your target portions that you've completed. It's calculated daily, weekly, and monthly to help you track your consistency. For example, if your daily target is 20 portions total and you complete 18, your adherence is 90%.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>When does my daily tracking reset?</Text>
          <Text style={styles.answer}>
            By default, your tracking resets at midnight. You can customize this in Settings under "Daily Reset" if you prefer a different time (for example, 4 AM if you work night shifts).
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>Can I track past days?</Text>
          <Text style={styles.answer}>
            Yes! Use the day selector at the top of the Track screen to view and edit previous days. Your history is preserved automatically, and you can go back to update any day.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>How do I view my history?</Text>
          <Text style={styles.answer}>
            Tap the History tab to see your past tracking days, along with daily, weekly, and monthly adherence summaries. You can expand any day to see which portions you completed.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>Can I track my weight?</Text>
          <Text style={styles.answer}>
            Yes! The Weight tab lets you log your weight over time and see a visual chart of your progress. You can also see how your current weight compares to your goal weight.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>What if I want to track calories or macros?</Text>
          <Text style={styles.answer}>
            Portion Tracker focuses on food groups and portions, not calories or macros. This approach is simpler and helps build sustainable eating habits without the stress of counting every calorie.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>Can I turn off the celebration animation?</Text>
          <Text style={styles.answer}>
            Yes! Go to Settings and toggle "Daily Completion Celebration" off if you prefer not to see the celebration when you complete all your portions for the day.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>How do I update my profile information?</Text>
          <Text style={styles.answer}>
            Go to the Profile tab and tap "Edit Profile" to update your sex, current weight, goal weight, or primary goal. Your portion targets will automatically adjust based on your changes.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>How do I reset all my data?</Text>
          <Text style={styles.answer}>
            Go to Settings and tap "Reset App Data" at the bottom. This will clear all your data and return you to the welcome screen. Use with caution—this action cannot be undone!
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>What are the size categories?</Text>
          <Text style={styles.answer}>
            The app uses Small, Medium, and Large categories based on your sex and weight to set starting targets. For females: Small is under 150 lbs, Medium is 150-189 lbs, Large is 190+ lbs. For males: Small is under 170 lbs, Medium is 170-209 lbs, Large is 210+ lbs. You don't see these categories—they just help calculate your initial targets.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
