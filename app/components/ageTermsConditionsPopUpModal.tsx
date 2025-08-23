import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useDarkMode } from "../../contexts/DarkModeContext";

interface ConfirmationPopupProps {
  visible: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmationPopup = ({
  visible,
  onConfirm,
  onClose,
}: ConfirmationPopupProps) => {
  const { isDarkMode } = useDarkMode();
  const { t, i18n } = useTranslation();
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  const handleConfirm = () => {
    if (isAgeConfirmed && isTermsAccepted) {
      // Store acceptance in persistent storage if needed
      onConfirm();
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.popup, isDarkMode && styles.popupDark]}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="warning" size={24} color="#FDBA74" />
            <Text style={[styles.title, isDarkMode && styles.titleDark]}>
              {t("confirmation.title")}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Age Confirmation */}
            <View style={styles.confirmationRow}>
              <Switch
                value={isAgeConfirmed}
                onValueChange={setIsAgeConfirmed}
                trackColor={{ false: "#767577", true: "#FDBA74" }}
                thumbColor={isAgeConfirmed ? "#F59E0B" : "#f4f3f4"}
              />
              <Text
                style={[
                  styles.confirmationText,
                  isDarkMode && styles.confirmationTextDark,
                ]}
              >
                {t("confirmation.ageVerification")}
              </Text>
            </View>

            {/* Terms Acceptance */}
            <View style={styles.confirmationRow}>
              <Switch
                value={isTermsAccepted}
                onValueChange={setIsTermsAccepted}
                trackColor={{ false: "#767577", true: "#FDBA74" }}
                thumbColor={isTermsAccepted ? "#F59E0B" : "#f4f3f4"}
              />
              <View style={styles.termsTextContainer}>
                <Text
                  style={[
                    styles.confirmationText,
                    isDarkMode && styles.confirmationTextDark,
                  ]}
                >
                  {t("confirmation.termsText") + " "}
                </Text>
                <Pressable
                  onPress={() =>
                    openLink(
                      "https://www.notion.so/2584d92eda86808ba34dc4fddbc7567c?source=copy_link"
                    )
                  }
                >
                  <Text style={styles.link}>{t("confirmation.termsLink")}</Text>
                </Pressable>
                <Text
                  style={[
                    styles.confirmationText,
                    isDarkMode && styles.confirmationTextDark,
                  ]}
                >
                  {" " + t("confirmation.and") + " "}
                </Text>
                <Pressable
                  onPress={() =>
                    openLink(
                      "https://www.notion.so/Yapyap-Privacy-Policy-1283fdf5aef44dee8b289509b465f0b9"
                    )
                  }
                >
                  <Text style={styles.link}>
                    {t("confirmation.privacyLink")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                (!isAgeConfirmed || !isTermsAccepted) && styles.buttonDisabled,
                pressed &&
                  isAgeConfirmed &&
                  isTermsAccepted &&
                  styles.buttonPressed,
                isDarkMode && styles.confirmButtonDark,
              ]}
              onPress={handleConfirm}
              disabled={!isAgeConfirmed || !isTermsAccepted}
            >
              <Text
                style={[
                  styles.buttonText,
                  isDarkMode && styles.confirmButtonTextDark,
                ]}
              >
                {t("confirmation.confirm")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  popup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  popupDark: {
    backgroundColor: "#1F2937",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },
  titleDark: {
    color: "#F9FAFB",
  },
  content: {
    marginBottom: 24,
    gap: 16,
  },
  confirmationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  termsTextContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
  },
  confirmationText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  confirmationTextDark: {
    color: "#D1D5DB",
  },
  link: {
    fontSize: 15,
    color: "#FDBA74",
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonDark: {
    backgroundColor: "#374151",
  },
  confirmButton: {
    backgroundColor: "#FDBA74",
  },
  confirmButtonDark: {
    backgroundColor: "#FDBA74",
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cancelButtonTextDark: {
    color: "#1F2937",
  },
  confirmButtonTextDark: {
    color: "#FFFFFF",
  },
});

export default ConfirmationPopup;
