import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ClerkProvider } from "./ClerkProvider";
import { ConvexProvider } from "./ConvexProvider";
import { ThemeProvider } from "./ThemeProvider";
import { RevenueCatProvider } from "./RevenueCatProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider>
        <ConvexProvider>
          <RevenueCatProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </RevenueCatProvider>
        </ConvexProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
