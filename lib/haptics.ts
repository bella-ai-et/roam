import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const haptic = (fn: () => Promise<void>) => { if (Platform.OS === "ios") fn(); };

export const hapticLight = () => haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const hapticMedium = () => haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const hapticHeavy = () => haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
export const hapticSelection = () => haptic(() => Haptics.selectionAsync());
export const hapticSuccess = () => haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const hapticWarning = () => haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
export const hapticError = () => haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));

export const hapticSwipe = () => hapticMedium();
export const hapticLike = () => hapticMedium();
export const hapticReject = () => hapticLight();
export const hapticMatch = () => hapticSuccess();
export const hapticButtonPress = () => hapticSelection();
export const hapticTabPress = () => hapticSelection();
