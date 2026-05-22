import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, ScrollView, KeyboardAvoidingView, Modal } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInUp, SlideInUp } from 'react-native-reanimated';

function HeaderIcon() {
  return (
    <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.headerIconContainer}>
      <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <Path d="M4 14C4 8.47715 8.47715 4 14 4H18C19.1046 4 20 4.89543 20 6V10C20 15.5228 15.5228 20 10 20H6C4.89543 20 4 19.1046 4 18V14Z" fill="white" />
        <Path d="M12 7L13.5 10.5L17 12L13.5 13.5L12 17L10.5 13.5L7 12L10.5 10.5L12 7Z" fill="#20293a" />
      </Svg>
    </Animated.View>
  );
}

function ModalIllustration() {
  return (
    <View style={styles.modalIllustrationBox}>
      <Svg width="200" height="200" viewBox="0 0 100 100" fill="none">
        <Circle cx="50" cy="50" r="40" fill="#f3e8ff" />
        <Path d="M35 15 L75 25 L65 85 L25 75 Z" fill="#1e293b" />
        <Path d="M38 18 L72 27 L63 82 L29 73 Z" fill="#ffffff" />
        <Path d="M43 23 L47 24.5 M50 25 L55 26.5" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <Circle cx="50" cy="55" r="22" fill="#8b5cf6" />
        <Path d="M45 48 V45 C45 42 55 42 55 45 V48 H58 V61 H42 V48 H45 Z" fill="#ffffff" />
        <Circle cx="50" cy="54" r="2" fill="#8b5cf6" />
        <Path d="M48 54 L49 57 H51 L52 54 Z" fill="#8b5cf6" />
      </Svg>
    </View>
  );
}

import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const ENV_URL = __DEV__ 
  ? (debuggerHost ? `http://${debuggerHost.split(':')[0]}:4000` : 'http://localhost:4000')
  : 'https://krishsatasiya-prescripto.onrender.com';

const BASE_URL = ENV_URL;
const API_URL = `${BASE_URL}/api/user`;

export default function LoginScreen() {
  const { setToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);

  // UX states for input focus styling
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Both fields are required.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password, 
          recaptchaToken: 'custom_captcha_' + Date.now() 
        }),
      });
      const data = await res.json();
      if (data.success) {
        await AsyncStorage.setItem('userToken', data.token);
        setToken(data.token);
        router.replace('/(tabs)');
      } else {
        setErrorMsg('ERROR: ' + data.message);
      }
    } catch (error: any) {
      setErrorMsg('ERROR: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => setShowModal(true);
  const formatEmailMask = (em: string) => {
    if (!em || !em.includes('@')) return 'your***@email.com';
    const parts = em.split('@');
    if (parts[0].length <= 2) return `${parts[0]}***@${parts[1]}`;
    return `${parts[0].slice(0, 3)}*******${parts[0].slice(-2)}@${parts[1]}`;
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      
      {/* Top Header */}
      <View style={styles.headerSection}>
        <HeaderIcon />
        <Animated.Text entering={FadeInDown.duration(600).delay(200)} style={styles.headerTitle}>
          Welcome Back!
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(600).delay(300)} style={styles.headerSubtitle}>
          Sign in to continue your healthcare journey.
        </Animated.Text>
      </View>

      {/* Bottom Sheet Form */}
      <Animated.View entering={SlideInUp.duration(600).damping(18)} style={styles.formSection}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
              <Feather name="mail" size={20} color={focusedInput === 'email' ? "#5F6FFF" : "#64748b"} style={styles.iconNode} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email address..."
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(500)}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}>
              <Feather name="lock" size={20} color={focusedInput === 'password' ? "#5F6FFF" : "#64748b"} style={styles.iconNode} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(600)}>
            <TouchableOpacity style={styles.forgotPassBtn} onPress={handleForgotPassword}>
              <Text style={styles.forgotPassText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Animated.View>

          {!!errorMsg && (
            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorBox}>
              <Feather name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.duration(400).delay(700)}>
            <TouchableOpacity 
              style={[styles.submitBtn, (!email || !password) && styles.submitBtnDisabled]} 
              onPress={handleLogin} 
              disabled={loading || !email || !password}
            >
              {loading ? <ActivityIndicator color="#ffffff" /> : (
                <Text style={styles.submitBtnText}>Sign In <Feather name="arrow-right" size={18} /></Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(800)}>
            <TouchableOpacity onPress={() => router.push('/signup')} style={styles.footerLink}>
              <Text style={styles.footerText}>
                Don't have an account? <Text style={styles.footerHighlight}>Sign Up.</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </Animated.View>

      <Modal visible={showModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInUp.duration(400)} style={styles.modalCard}>
            <ModalIllustration />
            <Text style={styles.modalTitle}>Password Sent!</Text>
            <Text style={styles.modalSubtext}>
              We've sent the password to{'\n'}
              <Text style={styles.emailMaskText}>{formatEmailMask(email || 'krish@example.com')}</Text>
            </Text>
            <TouchableOpacity style={styles.submitBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.submitBtnText}>Awesome <Feather name="check" size={18} /></Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E2532',
  },
  headerSection: {
    flex: 0.40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
  },
  headerIconContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: '#ffffff',
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formSection: {
    flex: 0.60,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  inputLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
  },
  inputFocused: {
    borderColor: '#5F6FFF',
    backgroundColor: '#f8faff',
  },
  iconNode: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#0f172a',
    height: '100%',
  },
  eyeBtn: {
    padding: 8,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPassText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#5F6FFF',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#ef4444',
    marginLeft: 10,
  },
  submitBtn: {
    height: 56,
    backgroundColor: '#5F6FFF', 
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5F6FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  footerLink: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  footerText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#64748b',
  },
  footerHighlight: {
    color: '#ef4444',
    fontFamily: 'Poppins_600SemiBold',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Dark dimming exactly like image
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalIllustrationBox: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: '#1e293b',
    marginBottom: 12,
  },
  modalSubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emailMaskText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#475569',
  },
  modalCloseBtn: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
