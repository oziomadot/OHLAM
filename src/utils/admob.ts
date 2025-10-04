import { Platform } from 'react-native';

// Centralized Ad Unit IDs (replace with production IDs when ready)
export const bannerAdUnitID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/2934735716',
  android: 'ca-app-pub-3940256099942544/6300978111',
}) || '';

// Initialize Mobile Ads on native platforms only
export const initializeMobileAds = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    const { MobileAds } = await import('react-native-google-mobile-ads');
    await MobileAds().initialize();
    if (__DEV__) console.log('Mobile Ads initialized');
  } catch (error) {
    console.warn('Failed to initialize Mobile Ads:', error);
  }
};

export const getBannerAdUnitId = (): string => bannerAdUnitID;

export default {
  bannerAdUnitID,
  initializeMobileAds,
  getBannerAdUnitId,
};
