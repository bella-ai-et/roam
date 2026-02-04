import * as SecureStore from 'expo-secure-store';

export interface OnboardingData {
  editing?: boolean;
  profileId?: string;
  vanPhotoUrl?: string;
  name: string;
  dateOfBirth: number; // timestamp
  gender: string;
  photos: string[]; // storageIds
  lookingFor: string[];
  interests: string[];
  vanType: string;
  vanBuildStatus: string;
  currentRoute: Array<{
    location: { latitude: number; longitude: number; name: string };
    arrivalDate: string;
    departureDate: string;
    notes?: string;
  }>;
}

const STORE_KEY = 'roam_onboarding_state';
const store: Partial<OnboardingData> = {};

export async function loadOnboardingData(): Promise<boolean> {
  try {
    const json = await SecureStore.getItemAsync(STORE_KEY);
    if (json) {
      const data = JSON.parse(json);
      // Clear current store and assign new data
      Object.keys(store).forEach((key) => delete (store as any)[key]);
      Object.assign(store, data);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to load onboarding data', e);
    return false;
  }
}

export async function saveOnboardingData(): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save onboarding data', e);
  }
}

export function setOnboardingField<K extends keyof OnboardingData>(
  key: K,
  value: OnboardingData[K]
) {
  store[key] = value;
  saveOnboardingData(); // Fire and forget
}

export function getOnboardingData(): Partial<OnboardingData> {
  return { ...store };
}

export async function resetOnboardingData() {
  Object.keys(store).forEach((key) => delete (store as any)[key]);
  try {
    await SecureStore.deleteItemAsync(STORE_KEY);
  } catch (e) {
    console.error('Failed to reset onboarding data', e);
  }
}
