import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_KEY_PREFIX = '@portion_tracker_daily_photo';

function buildDailyKey(date: string): string {
  return `${DAILY_KEY_PREFIX}_${date}`;
}

export async function saveDailyPhoto(date: string, uri: string): Promise<void> {
  const key = buildDailyKey(date);
  console.log('photoStorage: saving daily photo', { date, key });
  await AsyncStorage.setItem(key, uri);
}

export async function loadDailyPhoto(date: string): Promise<string | null> {
  const key = buildDailyKey(date);
  const uri = await AsyncStorage.getItem(key);
  console.log('photoStorage: loaded daily photo', { date, found: !!uri });
  return uri;
}

export async function deleteDailyPhoto(date: string): Promise<void> {
  const key = buildDailyKey(date);
  console.log('photoStorage: deleting daily photo', { date, key });
  await AsyncStorage.removeItem(key);
}
