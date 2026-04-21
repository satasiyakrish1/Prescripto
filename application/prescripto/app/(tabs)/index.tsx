import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AppContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInRight, ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

const specialities = [
  'All', 'Cardiology', 'Dermatology', 'Neurology', 'Pediatricians', 'Gastroenterology'
];

// Memoized Category Chip for optimization
const CategoryChip = React.memo(({ item, activeCategory, onPress }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item);
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={handlePress}
        style={[
          styles.categoryChip, 
          activeCategory === item && styles.categoryChipActive
        ]}
      >
        <Text style={[
          styles.categoryText, 
          activeCategory === item && styles.categoryTextActive
        ]}>{item}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Memoized Doctor Card for optimization
const DoctorCard = React.memo(({ doc, index }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.98, {}, () => {
      scale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/booking');
  };

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(600 + (index * 100))} style={animatedStyle}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={handlePress}
        style={styles.doctorCard}
      >
        <View style={styles.docCardMain}>
          <Image 
            source={doc.image} 
            style={styles.docCardImg}
            contentFit="cover"
            transition={300}
            placeholder={require('../../assets/images/favicon.png')} // Fallback
          />
          <View style={styles.docCardInfo}>
            <Text style={styles.docCardName}>{doc.name}</Text>
            <Text style={styles.docCardSpec}>{doc.speciality}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.ratingText}>4.9 | 190 Reviews</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.bookmarkBtn}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
          >
            <Feather name="bookmark" size={20} color="#5F6FFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function HomeScreen() {
  const { userData, doctors, appointments, getDoctorsData, getUserAppointments } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([getDoctorsData(), getUserAppointments()]);
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [getDoctorsData, getUserAppointments]);

  // Optimized Filtering with useMemo
  const filteredDoctors = useMemo(() => {
    return doctors?.filter(doc => {
      const matchesCategory = activeCategory === 'All' || doc.speciality === activeCategory;
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           doc.speciality.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }) || [];
  }, [doctors, activeCategory, searchQuery]);

  const topDoctors = useMemo(() => filteredDoctors.slice(0, 6), [filteredDoctors]);

  // Find the next upcoming appointment that isn't cancelled
  const upcomingAppointment = useMemo(() => {
    if (!appointments || appointments.length === 0) return null;
    return appointments.find((app: any) => !app.cancelled && !app.isCompleted) || null;
  }, [appointments]);

  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.headerTop}>
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <Image 
                source={userData?.image || 'https://via.placeholder.com/150'} 
                style={styles.avatarPic}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
            <View style={styles.userGreeting}>
              <Text style={styles.greetingSmall}>Good morning!</Text>
              <Text style={styles.greetingLarge}>{userData?.name || 'Guest'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Feather name="bell" size={20} color="#1e293b" />
            {appointments.some((a: any) => !a.cancelled && !a.isCompleted) && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)}>
          <Text style={styles.mainHeadline}>How are you feeling today?</Text>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Search a doctor, medicine, etc..."
              style={styles.searchInput}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={styles.micBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <Feather name="mic" size={20} color="#1e293b" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5F6FFF" />
        }
      >
        
        {/* Upcoming Appointments Section */}
        {upcomingAppointment && (
          <>
            <View style={styles.sectionHeaderLine}>
              <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.upcomingCardContainer}>
              <LinearGradient
                colors={['#5F6FFF', '#3B49DF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upcomingCard}
              >
                <View style={styles.upcomingCardTop}>
                  <View style={styles.docInfoSmall}>
                    <Image 
                      source={upcomingAppointment.docData.image} 
                      style={styles.upcomingDocImg}
                      contentFit="cover"
                      transition={200}
                    />
                    <View style={styles.upcomingDocText}>
                      <Text style={styles.upcomingDocName}>{upcomingAppointment.docData.name}</Text>
                      <Text style={styles.upcomingDocSpec}>{upcomingAppointment.docData.speciality}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.videoCallBtn}
                    onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)}
                  >
                    <Ionicons name="videocam-outline" size={22} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.upcomingCardMiddle}>
                  <View style={styles.timeInfo}>
                    <Feather name="calendar" size={16} color="rgba(255,255,255,0.7)" />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.timeLabel}>Date</Text>
                      <Text style={styles.timeValue}>{upcomingAppointment.slotDate}</Text>
                    </View>
                  </View>
                  <View style={styles.timeInfo}>
                    <Feather name="clock" size={16} color="rgba(255,255,255,0.7)" />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.timeLabel}>Time</Text>
                      <Text style={styles.timeValue}>{upcomingAppointment.slotTime}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.upcomingCardBottom}>
                  <TouchableOpacity 
                    style={styles.rescheduleBtn}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  >
                    <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.viewProfileBtn}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  >
                    <Text style={styles.viewProfileBtnText}>Details</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </>
        )}

        {/* Popular Doctors Section */}
        <View style={styles.sectionHeaderLine}>
          <Text style={styles.sectionTitle}>Popular Doctors</Text>
          <TouchableOpacity onPress={() => router.push('/booking')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {specialities.map((item, index) => (
            <CategoryChip 
              key={item} 
              item={item} 
              activeCategory={activeCategory} 
              onPress={setActiveCategory} 
            />
          ))}
        </ScrollView>

        <View style={styles.doctorList}>
          {topDoctors.length > 0 ? (
            topDoctors.map((doc: any, index: number) => (
              <DoctorCard key={doc._id} doc={doc} index={index} />
            ))
          ) : (
            <Animated.View entering={FadeInDown.duration(600)} style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconBox}>
                <Feather name="search" size={40} color="#94a3b8" />
              </View>
              <Text style={styles.emptyStateTitle}>No Doctors Found</Text>
              <Text style={styles.emptyStateSubtitle}>
                We couldn't find any doctors in the "{activeCategory}" category.
              </Text>
              <TouchableOpacity 
                style={styles.resetBtn}
                onPress={() => setActiveCategory('All')}
              >
                <Text style={styles.resetBtnText}>Show All Doctors</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPic: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#5F6FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#ffffff',
  },
  userGreeting: {
    marginLeft: 12,
  },
  greetingSmall: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#64748B',
  },
  greetingLarge: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#1E293B',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  mainHeadline: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#1E293B',
    lineHeight: 28,
    marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#1E293B',
    marginLeft: 8,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  scrollContent: {
    paddingBottom: 160,
  },
  sectionHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#1E293B',
  },
  viewAllText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#64748B',
  },
  upcomingCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  upcomingCard: {
    borderRadius: 16,
    padding: 14,
    shadowColor: '#5F6FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  upcomingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  docInfoSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingDocImg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  upcomingDocPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingDocText: {
    marginLeft: 10,
  },
  upcomingDocName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  upcomingDocSpec: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  videoCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingCardMiddle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 14,
  },
  timeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  timeValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
  upcomingCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rescheduleBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  rescheduleBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#5F6FFF',
  },
  viewProfileBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  viewProfileBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#ffffff',
  },
  categoryScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  categoryChipActive: {
    backgroundColor: '#5F6FFF',
    borderColor: '#5F6FFF',
  },
  categoryText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#64748B',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  doctorList: {
    paddingHorizontal: 20,
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  docCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docCardImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  docCardPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  docCardName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#1E293B',
  },
  docCardSpec: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
  },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  resetBtn: {
    backgroundColor: '#F0F9FF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  resetBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#5F6FFF',
  },
});
