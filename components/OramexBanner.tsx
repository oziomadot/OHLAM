import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import * as FileSystem from 'expo-file-system';
import ApkInstaller from 'react-native-apk-install';
import { API_BASE_URL } from '@/config';



export const OramexBanner = () => {
  const { handleOramexIntegration, showOramexBanner, setShowOramexBanner } = useAuth(); // ← Use new hook
  const [isInstalled, setIsInstalled] = useState(false);
  const BASE_URL = API_BASE_URL.replace("/api", "");
  const APK_URL = BASE_URL+'/apks/oramex-game-pro.apk';
const APK_PATH = `${FileSystem.documentDirectory}oramex-game-pro.apk`;

  useEffect(() => {
    if (!showOramexBanner) return;

    const checkInstallation = async () => {
      const canOpen = await Linking.canOpenURL('oramexgamepro://test');
      setIsInstalled(canOpen);
    };
    checkInstallation();
  }, [showOramexBanner]);

  if (!showOramexBanner) return null;

const handleDownload = async () => {
  try {
    const { uri } = await FileSystem.downloadAsync(APK_URL, APK_PATH);
    console.log('APK downloaded to:', uri);

    ApkInstaller.install(uri);
  } catch (error) {
    console.error('Install failed:', error);
    Alert.alert('Error', 'Failed to install APK. Enable "Install unknown apps" in Settings.');
  }
};

  const handleOpen = () => {
    handleOramexIntegration();
  };

  const dismissBanner = () => {
    setShowOramexBanner(false);
  };

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        {isInstalled 
          ? 'Open in Oramex Game Pro to cash your coins!' 
          : 'Download Oramex Game Pro to cash your coins!'
        }
      </Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={isInstalled ? handleOpen : handleDownload}>
          <Text style={styles.buttonText}>{isInstalled ? 'Open App' : 'Download'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissButton} onPress={dismissBanner}>
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#4CAF50', // Green theme for Oramex
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginBottom: 16,
  },
  text: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  buttonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dismissButton: {
    marginLeft: 8,
  },
  dismissText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});