import React from "react";
import { Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useState } from "react";

const isWeb = Platform.OS === 'web';
const { width } = Dimensions.get('window');

// 👇 Define the type for your navigation routes
type RootStackParamList = {
  Home: undefined;
  About: undefined;
  Upload: undefined;
  Contact: undefined;
  Work: undefined;
  Appointment: undefined;
  Help: undefined;
  Games: undefined;
};



export default function Navbar() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const router = useRouter();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const links: { name: string; route: keyof RootStackParamList }[] = [
    { name: "Home", route: "Home" },
    { name: "About", route: "About" },
    { name: "Upload Apartment", route: "Upload" },
    { name: "Contact Us", route: "Contact" },
    { name: "Work With Us", route: "Work" },
    { name: "Customer Appointment", route: "Appointment" },
    { name: "Help", route: "Help" },
    { name: "Games", route: "Games" },
  ];


  // Define valid route paths
  type ValidRoute = 
    | '/'
    | '/games'
    
    | '/home'
    | '/upload'
    | '/work'
    | '/appointment'
    | '/help'
    | '/about'
    | '/contact'
       

  const menuItems: { label: string; path: ValidRoute }[] = [
    { label: "Home", path: "/" },
    { label: "Games", path: "/games" },
    { label: "About Us", path: "/about" },
    { label: "Contact Us", path: "/contact" },
  
    { label: "Upload Apartment", path: "/upload" },
    { label: "Work With Us", path: "/work" },
    { label: "Customer Appointment", path: "/appointment" },
    { label: "Help", path: "/help" },
  ];

  const navigateTo = (path: ValidRoute) => {
    // On native, use the tab group absolute paths
    const nativePath = path === '/'
      ? '/(tabs)/home'
      : `/(tabs)${path}`;
    const target = isWeb ? path : (nativePath as any);
    router.push(target);
    setMobileMenuVisible(false);
  };

  const renderDesktopMenu = () => (
      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.path}
            onPress={() => navigateTo(item.path)}
            style={styles.menuItemContainer}
          >
            <Text style={styles.menuItem}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );


    const renderMobileMenu = () => (
        <View style={styles.mobileMenuContainer}>
          <TouchableOpacity 
            onPress={() => setMobileMenuVisible(true)}
            style={styles.menuButton}
          >
            <Ionicons name="menu" size={32} color="#3b82f6" />
          </TouchableOpacity>
    
          <Modal
            animationType="slide"
            transparent={true}
            visible={mobileMenuVisible}
            onRequestClose={() => setMobileMenuVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.mobileMenu}>
                <View style={styles.mobileMenuHeader}>
                  <Text style={styles.mobileMenuTitle}>Menu</Text>
                  <TouchableOpacity 
                    onPress={() => setMobileMenuVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={28} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.mobileMenuItems}>
                  {menuItems.map((item) => (
                    <TouchableOpacity
                      key={item.path}
                      onPress={() => navigateTo(item.path)}
                      style={styles.mobileMenuItem}
                    >
                      <Text style={styles.mobileMenuItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      );

  return (
    <View style={{ width: '100%' }}>
          {/* App Branding */}
          <View style={styles.branding}>
            <View>
              <Image 
                source={require("../assets/logo.png")} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </View>
            <View style={styles.appName}>
              <View style={{flex: 1}}>
                {
                  isWeb && width > 768 ? (
                    <View>
                    <View style={{flex: 1}}>
                      <Text style={{fontSize: 24, fontWeight: 'bold', marginTop: 5, 
                      textAlign: 'center', color: 'green'}}>
                        Oramex House and Land Agency Management
                      </Text>
                    </View>
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    {renderDesktopMenu()}
                  </View>
                  </View>
                  ) : (
                    <View style={{ flexDirection: 'row'}}>
                        <View style={{width: '80%'}}>
                      <Text style={{fontSize: 18, fontWeight: 'bold', marginTop: 5, textAlign: 'left', color: 'green'}}>
                        Oramex House and Land Agency Management
                      </Text>
                      </View>
                      <View style={{width: '20%'}}>
                    {renderMobileMenu()}
                  </View>
                    </View>
                  )
                }
               
              </View>
            </View>
          </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#1E40AF", // blue
  },
  navItem: {
    marginHorizontal: 8,
    marginVertical: 5,
  },
  navText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  branding: { 
    alignItems: "center", 
    marginTop: 10,
    paddingHorizontal: 16
  },
  logo: { 
    width: 70, 
    height: 70, 
    resizeMode: "contain" 
  },
  appName: { 
    alignItems: 'center'
  },
  menu: {
    flexDirection: "row",
    flexWrap: 'wrap',
    justifyContent: "center",
    marginVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingBottom: 5,
    paddingHorizontal: 16
  },
  menuItemContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderRadius: 8,
  },
  menuItem: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#3b82f6" 
  },
  mobileMenuContainer: {
    paddingHorizontal: 16,
    alignItems: 'flex-end'
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  mobileMenu: {
    backgroundColor: 'white',
    width: '80%',
    maxWidth: 300,
    height: '100%',
    padding: 16,
  },
  mobileMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingBottom: 12,
    marginBottom: 12
  },
  mobileMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  closeButton: {
    padding: 4
  },
  mobileMenuItems: {
    flex: 1
  },
  mobileMenuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingHorizontal: 8
  },
  mobileMenuItemText: {
    fontSize: 16,
    color: '#334155'
  }
});
