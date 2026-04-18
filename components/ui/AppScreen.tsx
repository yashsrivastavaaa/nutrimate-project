import { ThemeContext } from "@/context/ThemeContext";
import { ReactNode, useContext } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: object;
};

export function AppScreen({ children, scroll = false, contentContainerStyle }: Props) {
  const { palette } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    scrollBody: { backgroundColor: palette.background, padding: 16, paddingBottom: 40 },
    body: { flex: 1, backgroundColor: palette.background, padding: 16 },
  });

  if (scroll) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scrollBody, contentContainerStyle]}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.body, contentContainerStyle]}>{children}</View>
    </KeyboardAvoidingView>
  );
}

