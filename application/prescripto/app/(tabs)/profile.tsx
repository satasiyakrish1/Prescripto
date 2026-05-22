import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useAuth } from '../../context/AppContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProfileScreen() {
  const { userData, logout, loadUserProfileData, loading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserProfileData();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [loadUserProfileData]);

  if (loading && !userData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5F6FFF" />
        <Text style={{ marginTop: 12, color: '#64748b', fontFamily: 'Poppins_400Regular' }}>Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Feather name="user-x" size={48} color="#94a3b8" />
        <Text style={{ marginTop: 16, fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#1e293b' }}>Profile Not Found</Text>
        <Text style={{ marginTop: 8, fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#64748b', textAlign: 'center' }}>
          We couldn't load your profile data. Please try logging in again.
        </Text>
        <TouchableOpacity style={[styles.logoutBtn, { width: '100%', marginTop: 24 }]} onPress={logout}>
          <Text style={styles.logoutBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Helper to parse address
  const getAddress = () => {
    if (!userData.address) return 'Not added';
    if (typeof userData.address === 'string') {
      try {
        const parsed = JSON.parse(userData.address);
        return `${parsed.line1}${parsed.line2 ? '\n' + parsed.line2 : ''}`;
      } catch (e) {
        return userData.address;
      }
    }
    return `${userData.address.line1 || ''}${userData.address.line2 ? '\n' + userData.address.line2 : ''}` || 'Not added';
  };

  return (
    <View style={styles.container}>
      {/* Minimalist Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <TouchableOpacity 
          style={styles.settingsBtn}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Feather name="settings" size={20} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5F6FFF" />
        }
      >
        
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={userData.image || 'https://via.placeholder.com/150'} 
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
            <TouchableOpacity 
              style={styles.editIconBadge}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            >
              <Feather name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{userData.name}</Text>
          <Text style={styles.profileEmail}>{userData.email}</Text>
          
          <TouchableOpacity 
            style={styles.editProfileBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Info Sections */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Feather name="mail" size={16} color="#64748b" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userData.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Feather name="phone" size={16} color="#64748b" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{userData.phone || 'Add phone number'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Feather name="map-pin" size={16} color="#64748b" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{getAddress()}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="person-outline" size={16} color="#64748b" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{userData.gender || 'Not specified'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Feather name="calendar" size={16} color="#64748b" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{userData.dob || 'Not specified'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.logoutSection}>
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              logout();
            }}
          >
            <Feather name="log-out" size={18} color="#ef4444" />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#1e293b',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  scrollContent: {
    paddingBottom: 160,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1e293b',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#1e293b',
  },
  profileEmail: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  editProfileBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editProfileBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#5F6FFF',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#94a3b8',
  },
  infoValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1e293b',
  },
  logoutSection: {
    marginHorizontal: 20,
    marginTop: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  logoutBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 8,
  }
});
