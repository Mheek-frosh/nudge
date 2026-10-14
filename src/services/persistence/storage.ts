import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistedState, Persistence } from '../../types';
import { SCHEMA_VERSION } from '../../types';

const STORAGE_KEY = 'nudge.schema.v1';

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<PersistedState>;
  return record.schemaVersion === SCHEMA_VERSION && Array.isArray(record.notifications) && Array.isArray(record.activity) && Array.isArray(record.sources) && Boolean(record.settings);
}

export const persistence: Persistence = {
  async load() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isPersistedState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  async save(state) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  async clear() {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
