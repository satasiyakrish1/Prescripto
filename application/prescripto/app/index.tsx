import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer } from 'expo-sensors';
import { router } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import LogoSVG from '../components/LogoSVG';

function PatternedBackground({ isLight = false }) {
  const color = isLight ? '#cfd6ff' : '#7884ff';
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width="100%" height="100%">
        {/* Abstract Curves matching the provided design */}
        <Path d="M-50 250 Q100 250 100 100" stroke={color} strokeWidth={30} fill="none" strokeLinecap="round" />
        <Path d="M300 -50 Q300 100 450 100" stroke={color} strokeWidth={30} fill="none" strokeLinecap="round" />
        <Path d="M-50 550 Q150 550 150 700" stroke={color} strokeWidth={30} fill="none" strokeLinecap="round" />
        <Path d="M250 850 Q250 650 400 650" stroke={color} strokeWidth={30} fill="none" strokeLinecap="round" />
        <Path d="M150 350 Q300 350 300 500" stroke={color} strokeWidth={30} fill="none" strokeLinecap="round" />
        <Path d="M0 80 Q150 80 150 230" stroke={color} strokeWidth={30} fill="none" strokeLinecap="round" />
        <Path d="M350 450 Q220 450 220 580" stroke={color} strokeWidth={30} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function QuoteIcon() {
  return (
    <Svg width="36" height="36" viewBox="0 0 24 24" fill="#5f6FFF">
      <Path d="M10 7H6v4h4L8 15h3l2-4V7zm10 0h-4v4h4l-2 4h3l2-4V7zM4 17h16" opacity={0} />
      <Path d="M9.4 6H4v5.4h5.4L7 16h2.7l2.7-5.4V6z M19.4 6H14v5.4h5.4L17 16h2.7l2.7-5.4V6z" />
    </Svg>
  );
}

export default function AppIndex() {
  const [step, setStep] = useState(0); // 0 = Logo, 1 = Loading/Shake, 2 = Quote
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loadingProgress] = useState(new Animated.Value(0));
  
  // Crossfade between states
  const transitionTo = (nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    const checkAuthImmediately = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        router.replace('/(tabs)');
      } else {
        // Only show splash if not logged in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();

        const timer1 = setTimeout(() => {
          transitionTo(1);
        }, 2500);
        return () => clearTimeout(timer1);
      }
    };
    
    checkAuthImmediately();
  }, []);

  useEffect(() => {
    if (step === 1) {
      // Start loading bar animation
      Animated.timing(loadingProgress, {
        toValue: 100,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      let shakeSubscription: any;
      let lastShakeTime = 0;

      Accelerometer.isAvailableAsync().then((isAvailable) => {
        if (isAvailable) {
          Accelerometer.setUpdateInterval(100);
          shakeSubscription = Accelerometer.addListener((accelerometerData: any) => {
            const { x, y, z } = accelerometerData;
            const totalForce = Math.abs(x) + Math.abs(y) + Math.abs(z);

            // Standard gravity is 1g total resting. Total force > 2.2 is usually a shake
            if (totalForce > 2.2) {
              const now = Date.now();
              if (now - lastShakeTime > 1000) {
                lastShakeTime = now;
                transitionTo(2);
                if (shakeSubscription) shakeSubscription.remove();
              }
            }
          });
        }
      }).catch(err => console.log('Sensors not available'));

      // Auto fallback if shaking isn't possible (e.g. emulator)
      const timerFallback = setTimeout(() => {
        if (shakeSubscription) shakeSubscription.remove();
        transitionTo(2);
      }, 6000);

      return () => {
        if (shakeSubscription) shakeSubscription.remove();
        clearTimeout(timerFallback);
      };
    }
  }, [step]);

  useEffect(() => {
    if (step === 2) {
      // Check if user is already authenticated
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      };

      // After showing quote for 4 seconds, proceed
      const timerComplete = setTimeout(() => {
        checkAuth();
      }, 4500);
      return () => clearTimeout(timerComplete);
    }
  }, [step]);

  const renderContent = () => {
    if (step === 0) {
      // Logo Screen
      return (
        <View style={styles.splashContainerWhite}>
          <LogoSVG width={240} height={51} />
        </View>
      );
    }

    if (step === 1) {
      // Loading Shake Screen
      const progressWidth = loadingProgress.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
      });

      return (
        <View style={styles.splashContainerBlue}>
          <PatternedBackground isLight={false} />
          
          <View style={styles.loadingWrapper}>
            <Text style={styles.loadingText}>Loading...</Text>
            
            <View style={styles.progressBarContainer}>
               <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>
            
            <View style={styles.shakeActionBox}>
               {/* Tiny Phone Shake Icon Placeholder */}
               <Svg width="18" height="24" viewBox="0 0 24 32" fill="none">
                 <Rect x="4" y="2" width="16" height="28" rx="3.5" stroke="white" strokeWidth="2.5" />
                 <Path d="M10 26h4" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
               </Svg>
               <Text style={styles.shakeText}>SHAKE SCREEN TO INTERACT!</Text>
            </View>
          </View>
        </View>
      );
    }

    if (step === 2) {
      // Quote Screen
      return (
        <View style={styles.splashContainerLightBlue}>
          <PatternedBackground isLight={true} />
          
          <View style={styles.quoteWrapper}>
            <QuoteIcon />
            <Text style={styles.quoteTextMain}>
              "Health is the complete harmony of the body and soul. "
            </Text>
            <Text style={styles.quoteTextAuthor}>— ARISTOTLE</Text>
          </View>
        </View>
      );
    }
  };

  return (
    <Animated.View style={[styles.mainContainer, { opacity: fadeAnim }]}>
      {renderContent()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  splashContainerWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContainerBlue: {
    flex: 1,
    backgroundColor: '#5F6FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContainerLightBlue: {
    flex: 1,
    backgroundColor: '#eef0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 40,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  shakeActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    opacity: 0.9,
  },
  shakeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 12,
    letterSpacing: 1.2,
  },
  quoteWrapper: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  quoteTextMain: {
    color: '#131633', // Very dark blue from text in image
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 38,
  },
  quoteTextAuthor: {
    color: '#5F6FFF', // Primary blue
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    marginTop: 30,
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});
