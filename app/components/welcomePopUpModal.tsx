import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { useTranslation } from 'react-i18next';

interface WelcomePopupProps {
  visible: boolean;
  onClose: () => void;
}

const WelcomePopup = ({ visible, onClose }: WelcomePopupProps) => {
  const { isDarkMode } = useDarkMode();
  const { t, i18n } = useTranslation();

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
            <Ionicons 
              name="megaphone" 
              size={24} 
              color="#FDBA74" 
            />
            <Text style={[styles.title, isDarkMode && styles.titleDark]}>
            {t('welcome.title')}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.bulletPoint}>
              <Text style={[styles.bullet, isDarkMode && styles.bulletDark]}>•</Text>
              <Text style={[styles.bulletText, isDarkMode && styles.bulletTextDark]}>
              {t('welcome.bullet1')}
              </Text>
            </View>

            <View style={styles.bulletPoint}>
              <Text style={[styles.bullet, isDarkMode && styles.bulletDark]}>•</Text>
              <Text style={[styles.bulletText, isDarkMode && styles.bulletTextDark]}>
              {t('welcome.bullet2')}
              </Text>
            </View>

            <View style={styles.bulletPoint}>
              <Text style={[styles.bullet, isDarkMode && styles.bulletDark]}>•</Text>
              <Text style={[styles.bulletText, isDarkMode && styles.bulletTextDark]}>
              {t('welcome.bullet3')}
              </Text>
            </View>
          </View>

          {/* Footer
          <Text style={[styles.footer, isDarkMode && styles.footerDark]}>
            Got it? Let's yap.
          </Text> */}

          {/* Button */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isDarkMode && styles.buttonDark
            ]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>
            {t('welcome.button')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  popupDark: {
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  titleDark: {
    color: '#F9FAFB',
  },
  content: {
    marginBottom: 20,
    gap: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#FDBA74',
    fontWeight: 'bold',
    marginTop: 2,
  },
  bulletDark: {
    color: '#FDBA74',
  },
  bulletText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    flex: 1,
  },
  bulletTextDark: {
    color: '#D1D5DB',
  },
  footer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  footerDark: {
    color: '#F9FAFB',
  },
  button: {
    backgroundColor: '#FDBA74',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDark: {
    backgroundColor: '#FDBA74',
  },
  buttonPressed: {
    backgroundColor: '#F59E0B',
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextDark: {
    color: '#FFFFFF',
  },
});

export default WelcomePopup;
