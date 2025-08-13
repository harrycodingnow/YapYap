import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export default function AboutModal({
  visible,
  onClose,
  isDarkMode,
}: AboutModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.modalContainer,
            isDarkMode && styles.modalContainerDark,
          ]}
        >
          {/* Header with gradient accent */}
          <View style={[styles.header, isDarkMode && styles.headerDark]}>
            <View style={styles.headerContent}>
              <View style={styles.titleRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="information-circle" size={24} color="black" />
                </View>
                <Text style={[styles.title, isDarkMode && styles.titleDark]}>
                  {t("about.title")}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.headerAccent} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* App Info Section */}
            <View style={[styles.section, styles.firstSection]}>
              <View
                style={[
                  styles.sectionCard,
                  isDarkMode && styles.sectionCardDark,
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons
                      name="phone-portrait-outline"
                      size={18}
                      color="black"
                    />
                  </View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      isDarkMode && styles.sectionTitleDark,
                    ]}
                  >
                    {t("about.appInfo")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Version Section */}
            <View style={styles.section}>
              <View
                style={[
                  styles.sectionCard,
                  isDarkMode && styles.sectionCardDark,
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="code-slash" size={18} color="black" />
                  </View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      isDarkMode && styles.sectionTitleDark,
                    ]}
                  >
                    {t("about.version")}
                  </Text>
                  <Text
                    style={[
                      styles.sectionTitle,
                      isDarkMode && styles.sectionTitleDark,
                    ]}
                  >
                    v1.0.0
                  </Text>
                </View>
              </View>
            </View>

            {/* Credits Section */}
            <View style={styles.section}>
              <View
                style={[
                  styles.sectionCard,
                  isDarkMode && styles.sectionCardDark,
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="heart" size={18} color="black" />
                  </View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      isDarkMode && styles.sectionTitleDark,
                    ]}
                  >
                    {t("about.credits")}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.description,
                    isDarkMode && styles.descriptionDark,
                  ]}
                >
                  {t("about.creditsText")}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, isDarkMode && styles.footerDark]}>
            <TouchableOpacity
              style={[
                styles.closeButtonMain,
                isDarkMode && styles.closeButtonMainDark,
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.closeButtonText,
                  isDarkMode && styles.closeButtonTextDark,
                ]}
              >
                {t("about.close")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 50,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: "100%",
    height: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 },
    elevation: 20,
    overflow: "hidden",
  },
  modalContainerDark: {
    backgroundColor: "#1F2937",
  },
  header: {
    backgroundColor: "#F8FAFC",
    paddingBottom: 0,
  },
  headerDark: {
    backgroundColor: "#111827",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(253, 186, 116, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  titleDark: {
    color: "#F9FAFB",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  headerAccent: {
    height: 4,
    backgroundColor: "#FDBA74",
    marginHorizontal: 20,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  section: {
    marginBottom: 16,
  },
  firstSection: {
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: "#FAFBFC",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FDBA74",
  },
  sectionCardDark: {
    backgroundColor: "#374151",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(253, 186, 116, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  sectionTitleDark: {
    color: "#F9FAFB",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  descriptionDark: {
    color: "#D1D5DB",
  },
  featureList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FDBA74",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    opacity: 0.3,
  },
  featureText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    lineHeight: 18,
  },
  featureTextDark: {
    color: "#D1D5DB",
  },
  versionBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(253, 186, 116, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  versionBadgeDark: {
    backgroundColor: "#FDBA74",
  },
  versionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  versionTextDark: {
    color: "#1F2937",
  },
  footer: {
    padding: 20,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerDark: {
    backgroundColor: "#111827",
    borderTopColor: "#374151",
  },
  closeButtonMain: {
    backgroundColor: "#FDBA74",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#FDBA74",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  closeButtonMainDark: {
    backgroundColor: "#FDBA74",
  },
  closeButtonText: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "700",
  },
  closeButtonTextDark: {
    color: "#1F2937",
  },
});
