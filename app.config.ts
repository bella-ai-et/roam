import { ExpoConfig, ConfigContext } from 'expo/config';

const hasGoogleMapsKey = !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Zelani',
  slug: 'zelani',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/zelani-icon.png',
  scheme: 'zelani',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.abeldesu.zelani',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription: 'We need access to your photos to upload your van and profile pictures.',
      NSLocationWhenInUseUsageDescription: 'We use your location to help match you with nomads on overlapping routes.',
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#1A1A2E',
      foregroundImage: './assets/images/zelani-icon.png',
    },
    permissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
    package: 'com.abeldesu.zelani',
    ...(hasGoogleMapsKey && {
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    }),
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'We use your location to help match you with nomads on overlapping routes.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'We need access to your photos to upload your van and profile pictures.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/zelani-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#1A1A2E',
      },
    ],
    'expo-font',
    'expo-image',
    'expo-web-browser',
    ...(hasGoogleMapsKey
      ? ([[
            'expo-maps',
            { requestLocationPermission: true },
          ]] as [string, any][])
      : []),
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '71f60535-5253-41bb-980a-ee11e181076c',
    },
  },
  owner: 'alexdesu',
});
