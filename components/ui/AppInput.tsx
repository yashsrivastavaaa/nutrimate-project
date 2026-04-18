import { palette } from "@/lib/theme";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function AppInput({ label, error, ...inputProps }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#94A3B8"
        style={[styles.input, !!error && styles.inputError]}
        accessibilityLabel={label}
        accessibilityHint={error ? `Error: ${error}` : undefined}
        accessibilityRole="text"
        {...inputProps}
      />
      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: "600",
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: palette.text,
  },
  inputError: {
    borderColor: palette.danger,
  },
  error: {
    color: palette.danger,
    fontSize: 12,
  },
});

