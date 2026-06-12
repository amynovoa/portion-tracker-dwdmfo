import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = '@portion_tracker_photo';

function buildKey(date: string, foodGroup: string): string {
  return `${KEY_PREFIX}_${date}_${foodGroup}`;
}

export async function savePortionPhoto(date: string, foodGroup: string, uri: string): Promise<void> {
  const key = buildKey(date, foodGroup);
  console.log('photoStorage: saving photo', { date, foodGroup, key });
  await AsyncStorage.setItem(key, uri);
}

export async function loadPortionPhoto(date: string, foodGroup: string): Promise<string | null> {
  const key = buildKey(date, foodGroup);
  const uri = await AsyncStorage.getItem(key);
  console.log('photoStorage: loaded photo', { date, foodGroup, found: !!uri });
  return uri;
}

export async function deletePortionPhoto(date: string, foodGroup: string): Promise<void> {
  const key = buildKey(date, foodGroup);
  console.log('photoStorage: deleting photo', { date, foodGroup, key });
  await AsyncStorage.removeItem(key);
}

export async function loadAllPhotosForDate(date: string): Promise<Record<string, string>> {
  const prefix = `${KEY_PREFIX}_${date}_`;
  const allKeys = await AsyncStorage.getAllKeys();
  const photoKeys = allKeys.filter(k => k.startsWith(prefix));

  if (photoKeys.length === 0) {
    return {};
  }

  const pairs = await AsyncStorage.multiGet(photoKeys);
  const result: Record<string, string> = {};

  for (const [key, value] of pairs) {
    if (value) {
      const foodGroup = key.slice(prefix.length);
      result[foodGroup] = value;
    }
  }

  console.log('photoStorage: loaded all photos for date', { date, count: Object.keys(result).length });
  return result;
}
