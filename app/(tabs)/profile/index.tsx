import { View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Navbar from "components/Navbar";
import Protected from "components/Protected";
import API from "@/src/services/api";
import { getItem, setItem } from "../../utils/storage";
export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);
    const router = useRouter();
    const BASE_URL = API;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
              const user = await getItem("user");
                // const response = await API.get('/auth/me');
                console.log(user);
                setProfileData(JSON.parse(user));
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchProfile();

    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <Protected>
            <View style={styles.container}>
                <Navbar />
                <ScrollView style={styles.scrollView}>
                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            {profileData?.profile_picture ? (
                                <Image 
                                    source={
                                    user?.profile_picture
                                        ? { uri: `${BASE_URL}/storage/${user.profile_picture}` }
              : require("@/assets/default-avatar.png")                                    } 
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={60} color="#666" />
                                </View>
                            )}
                            <TouchableOpacity 
                                style={styles.editButton}
                                onPress={() => router.push("/profile/edit")}
                            >
                                <Ionicons name="pencil" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.name}>
                            {profileData?.firstname} {profileData?.surname}
                        </Text>
                        <Text style={styles.role}>
                            {profileData?.registration_status?.name || 'User'}
                        </Text>
                         <Text style={styles.role}>
                            {profileData?.oramexID}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        <InfoRow label="Email" value={profileData?.email} />
                        <InfoRow label="Phone" value={profileData?.phonenumber} />
                        {profileData?.whatsapp && <InfoRow label="WhatsApp" value={profileData.whatsapp} />}
                        {profileData?.dob && <InfoRow label="Date of Birth" value={new Date(profileData.dob).toLocaleDateString()} />}
                    </View>

                    {profileData?.registration_status?.id === "3" && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Professional Information</Text>
                            {profileData?.workPhoneNumber && <InfoRow label="Work Phone" value={profileData.workPhoneNumber} />}
                            {profileData?.instagram && <InfoRow label="Instagram" value={profileData.instagram} />}
                            {profileData?.linkedln && <InfoRow label="LinkedIn" value={profileData.linkedln} />}
                            {profileData?.philosophy && <InfoRow label="Guiding Principle" value={profileData.philosophy} />}
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                       <TouchableOpacity 
                                style={styles.updateButton}
                                onPress={() => router.push("/profile/edit")}
                            >
                                <Text>Update Profile </Text>
                            </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Protected>
    );
}

const InfoRow = ({ label, value }: { label: string; value: string | undefined | null }) => {
    if (!value) return null;
    
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}:</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
        zIndex: Platform.OS === "web" ? -1 : 0,
    },
    header: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007bff',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    role: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 10,
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    infoLabel: {
        width: 120,
        color: '#666',
        fontWeight: '500',
    },
    infoValue: {
        flex: 1,
        color: '#333',
    },
    buttonContainer:{
        backgroundColor: '#fff',
        marginTop: 10,
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
        width: '100%',
        alignItems: 'center', 
    },
    updateButton:{
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
});