import { palette } from "@/lib/theme";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (uri: string) => Promise<void> | void;
};

export function CameraCapture({ visible, loading = false, onCancel, onConfirm }: Props) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionAttempted, setPermissionAttempted] = useState(false);
  const [facing] = useState<CameraType>("back");

  useEffect(() => {
    if (!visible) {
      setCapturedUri(null);
      setCameraError("");
      setCameraReady(false);
      setPermissionAttempted(false);
      return;
    }

    if (!permission?.granted && !permissionAttempted) {
      setPermissionAttempted(true);
      requestPermission().catch(() => setCameraError("Unable to request camera permission."));
    }
  }, [permission?.granted, permissionAttempted, requestPermission, visible]);

  const takePicture = async () => {
    if (!cameraRef.current || !cameraReady || loading) return;
    try {
      setCameraError("");
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });
      if (!photo?.uri) {
        throw new Error("Unable to capture image.");
      }
      setCapturedUri(photo.uri);
    } catch (error) {
      console.error(error);
      setCameraError("Camera failed. Please try again.");
    }
  };

  const confirm = async () => {
    if (!capturedUri || loading) return;
    try {
      await onConfirm(capturedUri);
    } catch (error) {
      console.error(error);
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Unable to process image.");
    }
  };

  const loadingPermission = !permission;
  const denied = permission !== null && !permission.granted;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <View style={styles.root}>
        {loadingPermission ? (
          <View style={styles.permissionWrap}>
            <ActivityIndicator color={palette.primary} size="large" />
            <Text style={styles.permissionText}>Preparing camera...</Text>
          </View>
        ) : denied ? (
          <View style={styles.permissionWrap}>
            <Text style={styles.permissionTitle}>Camera access is required</Text>
            <Text style={styles.permissionText}>
              NutriMate needs camera access so donation photos can be captured directly in app.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : capturedUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: capturedUri }} style={styles.previewImage} contentFit="cover" />
            <View style={styles.previewSheet}>
              <Text style={styles.previewTitle}>Review photo</Text>
              <Text style={styles.previewText}>Make sure the food and packaging are clearly visible.</Text>
              {cameraError ? <Text style={styles.errorText}>{cameraError}</Text> : null}
              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => setCapturedUri(null)}
                  disabled={loading}
                >
                  <Text style={styles.secondaryButtonText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton, loading && styles.disabledButton]}
                  onPress={confirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              mode="picture"
              active={visible && !loading}
              onCameraReady={() => setCameraReady(true)}
              onMountError={() => setCameraError("Camera failed to open. Please try again.")}
            />
            <View style={styles.overlay}>
              <View style={styles.topBar}>
                <Pressable onPress={onCancel} style={styles.topButton}>
                  <Text style={styles.topButtonText}>Close</Text>
                </Pressable>
                <Text style={styles.topTitle}>Capture donation photo</Text>
                <View style={styles.topSpacer} />
              </View>

              <View style={styles.bottomBar}>
                <Text style={styles.helperText}>Center the food donation in frame, then capture.</Text>
                {cameraError ? <Text style={styles.errorText}>{cameraError}</Text> : null}
                <View style={styles.captureRow}>
                  <View style={styles.captureOuter}>
                    <TouchableOpacity
                      style={styles.captureInner}
                      onPress={takePicture}
                      disabled={loading || !cameraReady}
                    />
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  topBar: {
    paddingTop: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  topButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  topTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  topSpacer: {
    width: 64,
  },
  bottomBar: {
    paddingHorizontal: 18,
    paddingBottom: 34,
  },
  helperText: {
    color: "#F8FAFC",
    textAlign: "center",
    marginBottom: 14,
    fontSize: 13,
  },
  captureRow: {
    alignItems: "center",
  },
  captureOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: palette.primary,
  },
  permissionWrap: {
    flex: 1,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: palette.background,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.primaryDark,
    textAlign: "center",
  },
  permissionText: {
    color: palette.muted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: palette.primary,
    width: "100%",
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#E8F9EE",
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: palette.primaryDark,
    fontWeight: "800",
  },
  previewWrap: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewImage: {
    flex: 1,
  },
  previewSheet: {
    backgroundColor: palette.surface,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: palette.primaryDark,
  },
  previewText: {
    marginTop: 4,
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  previewActions: {
    marginTop: 18,
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  secondaryButton: {
    backgroundColor: "#E8F9EE",
    borderWidth: 1,
    borderColor: "#CFEED9",
  },
  secondaryButtonText: {
    color: palette.primaryDark,
    fontWeight: "800",
  },
  primaryButton: {
    backgroundColor: palette.primary,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.7,
  },
  errorText: {
    color: palette.danger,
    textAlign: "center",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "600",
  },
});
