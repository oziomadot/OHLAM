import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [smsNotifications, setSmsNotifications] = React.useState(false);

  const userData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    memberSince: 'January 2023',
    verified: true,
  };

  const menuItems = [
    { 
      icon: 'person-outline', 
      name: 'Edit Profile',
      onPress: () => navigation.navigate('EditProfile')
    },
    { 
      icon: 'notifications-outline', 
      name: 'Notifications',
      onPress: () => navigation.navigate('NotificationSettings')
    },
    { 
      icon: 'lock-closed-outline', 
      name: 'Privacy & Security',
      onPress: () => navigation.navigate('PrivacySettings')
    },
    { 
      icon: 'card-outline', 
      name: 'Payment Methods',
      onPress: () => navigation.navigate('PaymentMethods')
    },
    { 
      icon: 'document-text-outline', 
      name: 'My Documents',
      onPress: () => navigation.navigate('MyDocuments')
    },
    { 
      icon: 'heart-outline', 
      name: 'Saved Properties',
      onPress: () => navigation.navigate('SavedProperties')
    },
    { 
      icon: 'help-circle-outline', 
      name: 'Help & Support',
      onPress: () => navigation.navigate('HelpCenter')
    },
    { 
      icon: 'information-circle-outline', 
      name: 'About OPAAM',
      onPress: () => navigation.navigate('About')
    },
  ];

  const renderMenuItem = (item, index) => (
    <TouchableOpacity 
      key={index} 
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={item.icon} size={22} color="#666" />
      </View>
      <Text style={styles.menuText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: userData.avatar }} 
              style={styles.avatar}
            />
            {userData.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Properties</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Tours</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="dark-mode" size={24} color="#666" />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color="#666" />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="email" size={24} color="#666" />
              <Text style={styles.settingText}>Email Notifications</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={emailNotifications ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="message" size={24} color="#666" />
              <Text style={styles.settingText}>SMS Notifications</Text>
            </View>
            <Switch
              value={smsNotifications}
              onValueChange={setSmsNotifications}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={smsNotifications ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.versionText}>OPAAM v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2023 OPAAM. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 10,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#fff',
    marginBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#3498db',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#ddd',
  },
  editProfileButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#333',
    fontWeight: '500',
    marginLeft: 5,
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    margin: 15,
    marginBottom: 15,
    padding: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginLeft: 5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 15,
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    margin: 15,
    marginBottom: 15,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 40,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  logoutButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  copyrightText: {
    fontSize: 12,
    color: '#bbb',
  },
});

export default ProfileScreen;
