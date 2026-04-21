import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, TextInput, Alert } from 'react-native';
import { useAuth } from '../../context/AppContext';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

export default function BookingScreen() {
  const { doctors } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleBooking = (doctor: any) => {
    Alert.alert(
      "App in Beta Version",
      `Thank you for choosing ${doctor.name}. Our booking service is currently in beta. Official bookings will be available soon!`,
      [{ text: "OK" }]
    );
  };

  // Local filter for styling
  const filteredDoctors = doctors?.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.speciality.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <View style={styles.container}>
      {/* Custom Clean Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <Text style={styles.headerTitle}>All Doctors</Text>
        <Text style={styles.headerSubtitle}>Find and book your desired specialist.</Text>
      </Animated.View>

      {/* Floating Search Bar */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or speciality..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Results Info */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.resultsInfoRow}>
          <Text style={styles.resultsText}>
            Showing {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'}
          </Text>
        </Animated.View>

        <View style={styles.doctorGrid}>
          {filteredDoctors.map((doc: any, index: number) => (
            <Animated.View 
              key={doc._id} 
              entering={ZoomIn.duration(400).delay(200 + (index * 50))} 
              style={styles.doctorCardWrapper}
            >
              <TouchableOpacity style={styles.doctorCard} activeOpacity={0.9} onPress={() => handleBooking(doc)}>
                <View style={styles.docImageContainer}>
                  {doc.image ? (
                    <Image source={{ uri: doc.image }} style={styles.docImage} />
                  ) : (
                    <View style={[styles.docImage, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}>
                      <Feather name="user" size={32} color="#94a3b8" />
                    </View>
                  )}
                </View>

                <View style={styles.docInfo}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.availabilityBadge, { backgroundColor: doc.available ? '#ecfdf5' : '#fef2f2' }]}>
                      <View style={[styles.availDot, { backgroundColor: doc.available ? '#10b981' : '#ef4444' }]} />
                      <Text style={[styles.availText, { color: doc.available ? '#10b981' : '#ef4444' }]}>
                        {doc.available ? 'Available' : 'Booked'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                  <Text style={styles.docSpeciality} numberOfLines={1}>{doc.speciality}</Text>
                  
                  <View style={styles.experienceRow}>
                    <Feather name="award" size={14} color="#5F6FFF" />
                    <Text style={styles.experienceText}>{doc.experience || '3 Years'}</Text>
                    <View style={styles.dotSeparator} />
                    <Feather name="star" size={14} color="#f59e0b" />
                    <Text style={styles.ratingText}>4.8</Text>
                  </View>

                  {/* Decorative Book Button embedded in card */}
                  <View style={[styles.bookBtnSub, { opacity: doc.available ? 1 : 0.5 }]}>
                    <Text style={styles.bookBtnSubText}>Book Appointment</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}

          {filteredDoctors.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateTitle}>No doctors found</Text>
              <Text style={styles.emptyStateSubtitle}>Try searching for a different name or speciality</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#ffffff',
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#1e293b',
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#1e293b',
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 2 : 5,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  resultsInfoRow: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  resultsText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#1e293b',
  },
  doctorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16, // using 16 horizontal base for 2 column layout
  },
  doctorCardWrapper: {
    width: '50%',
    padding: 8,
  },
  doctorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  docImageContainer: {
    height: 140,
    backgroundColor: '#eaefff',
  },
  docImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  docInfo: {
    padding: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  availText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
  },
  docName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 2,
  },
  docSpeciality: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  experienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  experienceText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#5F6FFF',
    marginLeft: 4,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },
  ratingText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#f59e0b',
    marginLeft: 4,
  },
  bookBtnSub: {
    backgroundColor: '#f8faff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookBtnSubText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#5F6FFF',
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#1e293b',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  }
});
