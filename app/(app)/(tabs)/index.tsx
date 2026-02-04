import { Text, View, StyleSheet } from "react-native";
import { useAppTheme } from "@/lib/theme";

export default function DiscoverScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.onBackground }]}>Discover</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 24, fontWeight: "700" },
});
