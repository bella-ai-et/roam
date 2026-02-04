import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const tokenCache = {
  async getToken(key: string) {
    try {
      if (Platform.OS === "web") return null;
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error("SecureStore get error:", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      if (Platform.OS === "web") return;
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error("SecureStore save error:", error);
    }
  },
  async clearToken(key: string) {
    try {
      if (Platform.OS === "web") return;
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error("SecureStore clear error:", error);
    }
  },
};
