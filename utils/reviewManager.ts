
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

const REVIEW_METRICS_KEY = '@portion_tracker_review_metrics';
const LAST_REVIEW_PROMPT_KEY = '@portion_tracker_last_review_prompt';

interface ReviewMetrics {
  appOpenDays: string[]; // Array of dates when app was opened
  trackingActions: number; // Count of successful portion tracking actions
  targetsSaved: boolean; // Whether user has saved targets at least once
}

// Load review metrics from storage
async function loadReviewMetrics(): Promise<ReviewMetrics> {
  try {
    const data = await AsyncStorage.getItem(REVIEW_METRICS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading review metrics:', error);
  }
  
  return {
    appOpenDays: [],
    trackingActions: 0,
    targetsSaved: false,
  };
}

// Save review metrics to storage
async function saveReviewMetrics(metrics: ReviewMetrics): Promise<void> {
  try {
    await AsyncStorage.setItem(REVIEW_METRICS_KEY, JSON.stringify(metrics));
  } catch (error) {
    console.error('Error saving review metrics:', error);
  }
}

// Get the date of the last review prompt
async function getLastReviewPromptDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_REVIEW_PROMPT_KEY);
  } catch (error) {
    console.error('Error loading last review prompt date:', error);
    return null;
  }
}

// Save the date of the last review prompt
async function saveLastReviewPromptDate(date: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_REVIEW_PROMPT_KEY, date);
  } catch (error) {
    console.error('Error saving last review prompt date:', error);
  }
}

// Get today's date as a string (YYYY-MM-DD)
function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Record that the app was opened today
export async function recordAppOpen(): Promise<void> {
  const today = getTodayString();
  const metrics = await loadReviewMetrics();
  
  if (!metrics.appOpenDays.includes(today)) {
    metrics.appOpenDays.push(today);
    console.log('Review metrics: App opened on new day', today, 'Total unique days:', metrics.appOpenDays.length);
    await saveReviewMetrics(metrics);
  }
}

// Record a successful tracking action (portion logged)
export async function recordTrackingAction(): Promise<void> {
  const metrics = await loadReviewMetrics();
  metrics.trackingActions += 1;
  console.log('Review metrics: Tracking action recorded. Total:', metrics.trackingActions);
  await saveReviewMetrics(metrics);
}

// Record that targets were saved
export async function recordTargetsSaved(): Promise<void> {
  const metrics = await loadReviewMetrics();
  metrics.targetsSaved = true;
  console.log('Review metrics: Targets saved');
  await saveReviewMetrics(metrics);
}

// Check if we should show the review prompt
async function shouldShowReviewPrompt(): Promise<boolean> {
  // Only show on iOS (StoreReview is iOS-only)
  if (Platform.OS !== 'ios') {
    return false;
  }

  // Check if StoreReview is available
  const isAvailable = await StoreReview.isAvailableAsync();
  if (!isAvailable) {
    console.log('Review prompt: StoreReview not available');
    return false;
  }

  const metrics = await loadReviewMetrics();
  
  // Check if user has opened app on at least 5 separate days
  if (metrics.appOpenDays.length < 5) {
    console.log('Review prompt: Not enough app open days', metrics.appOpenDays.length, '/ 5');
    return false;
  }

  // Check if user has completed at least 10 tracking actions
  if (metrics.trackingActions < 10) {
    console.log('Review prompt: Not enough tracking actions', metrics.trackingActions, '/ 10');
    return false;
  }

  // Check if user has saved targets at least once
  if (!metrics.targetsSaved) {
    console.log('Review prompt: Targets not saved yet');
    return false;
  }

  // Check if we've prompted in the last 120 days
  const lastPromptDate = await getLastReviewPromptDate();
  if (lastPromptDate) {
    const lastPrompt = new Date(lastPromptDate);
    const today = new Date();
    const daysSinceLastPrompt = Math.floor((today.getTime() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastPrompt < 120) {
      console.log('Review prompt: Too soon since last prompt', daysSinceLastPrompt, '/ 120 days');
      return false;
    }
  }

  console.log('Review prompt: All conditions met!');
  return true;
}

// Request the review prompt if conditions are met
export async function requestReviewIfEligible(): Promise<void> {
  try {
    const shouldShow = await shouldShowReviewPrompt();
    
    if (shouldShow) {
      console.log('Review prompt: Requesting review from user');
      await StoreReview.requestReview();
      
      // Save the date we prompted
      const today = getTodayString();
      await saveLastReviewPromptDate(today);
      console.log('Review prompt: Review requested, saved prompt date:', today);
    }
  } catch (error) {
    console.error('Error requesting review:', error);
  }
}

// Get current metrics (for debugging)
export async function getReviewMetrics(): Promise<ReviewMetrics> {
  return await loadReviewMetrics();
}
