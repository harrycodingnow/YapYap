// app/components/SafetyActionModal.tsx
import { Ionicons } from "@expo/vector-icons";
import type { TFunction } from "i18next";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/** Shared types you can import elsewhere */
export type FlagReason =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "misinformation"
  | "other";

export type SafetyAction = "flag" | "block" | "hide";

/** Safety Action Modal */
export function SafetyActionModal({
  visible,
  onClose,
  onFlag,
  onBlock,
  onHide,
  isDarkMode,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  onFlag: () => void;
  onBlock: () => void;
  onHide: () => void;
  isDarkMode: boolean;
  t: TFunction;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.safetyModal,
            isDarkMode && styles.safetyModalDark,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.safetyModalHeader}>
            <Text
              style={[
                styles.safetyModalTitle,
                isDarkMode && styles.safetyModalTitleDark,
              ]}
            >
              {t("safety.title", "Report Content")}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.safetyActions}>
            <TouchableOpacity
              style={[
                styles.safetyActionItem,
                isDarkMode && styles.safetyActionItemDark,
              ]}
              onPress={onFlag}
            >
              <Ionicons name="flag-outline" size={20} color="#EF4444" />
              <Text
                style={[
                  styles.safetyActionText,
                  isDarkMode && styles.safetyActionTextDark,
                ]}
              >
                {t("safety.flag", "Flag Content")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.safetyActionItem,
                isDarkMode && styles.safetyActionItemDark,
              ]}
              onPress={onBlock}
            >
              <Ionicons
                name="person-remove-outline"
                size={20}
                color="#F59E0B"
              />
              <Text
                style={[
                  styles.safetyActionText,
                  isDarkMode && styles.safetyActionTextDark,
                ]}
              >
                {t("safety.block", "Block User")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.safetyActionItem,
                isDarkMode && styles.safetyActionItemDark,
              ]}
              onPress={onHide}
            >
              <Ionicons name="eye-off-outline" size={20} color="#6B7280" />
              <Text
                style={[
                  styles.safetyActionText,
                  isDarkMode && styles.safetyActionTextDark,
                ]}
              >
                {t("safety.hide", "Hide Post")}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/** Flag Reason Modal */
export function FlagReasonModal({
  visible,
  onClose,
  onSubmit,
  isDarkMode,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: FlagReason) => void;
  isDarkMode: boolean;
  t: TFunction;
}) {
  const reasons: { key: FlagReason; label: string; icon: string }[] = [
    {
      key: "spam",
      label: t("safety.reasons.spam", "Spam"),
      icon: "mail-outline",
    },
    {
      key: "harassment",
      label: t("safety.reasons.harassment", "Harassment"),
      icon: "warning-outline",
    },
    {
      key: "inappropriate",
      label: t("safety.reasons.inappropriate", "Inappropriate Content"),
      icon: "remove-circle-outline",
    },
    {
      key: "misinformation",
      label: t("safety.reasons.misinformation", "Misinformation"),
      icon: "information-circle-outline",
    },
    {
      key: "other",
      label: t("safety.reasons.other", "Other"),
      icon: "ellipsis-horizontal-outline",
    },
  ];

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.flagModal, isDarkMode && styles.flagModalDark]}>
          <View style={styles.flagModalHeader}>
            <Text
              style={[
                styles.flagModalTitle,
                isDarkMode && styles.flagModalTitleDark,
              ]}
            >
              {t("safety.flagReason", "Why are you reporting this?")}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.flagReasons}>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason.key}
                style={[
                  styles.flagReasonItem,
                  isDarkMode && styles.flagReasonItemDark,
                ]}
                onPress={() => onSubmit(reason.key)}
              >
                <Ionicons
                  name={reason.icon as any}
                  size={20}
                  color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.flagReasonText,
                    isDarkMode && styles.flagReasonTextDark,
                  ]}
                >
                  {reason.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Safety modal
  safetyModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  safetyModalDark: { backgroundColor: "#1F2937" },
  safetyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  safetyModalTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  safetyModalTitleDark: { color: "#F9FAFB" },
  closeButton: { padding: 4 },
  safetyActions: { gap: 12 },
  safetyActionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  safetyActionItemDark: { backgroundColor: "#374151", borderColor: "#4B5563" },
  safetyActionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
  },
  safetyActionTextDark: { color: "#F9FAFB" },

  // Flag modal
  flagModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  flagModalDark: { backgroundColor: "#1F2937" },
  flagModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  flagModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  flagModalTitleDark: { color: "#F9FAFB" },
  flagReasons: { gap: 8 },
  flagReasonItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  flagReasonItemDark: { backgroundColor: "#374151", borderColor: "#4B5563" },
  flagReasonText: { fontSize: 16, color: "#111827", flex: 1 },
  flagReasonTextDark: { color: "#F9FAFB" },
});
