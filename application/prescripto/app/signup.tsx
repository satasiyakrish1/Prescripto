import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AppContext';
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

import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const ENV_URL = __DEV__ 
  ? (debuggerHost ? `http://${debuggerHost.split(':')[0]}:4000` : 'http://localhost:4000')
  : 'https://krishsatasiya-prescripto.onrender.com';

const BASE_URL = ENV_URL;
const API_URL = `${BASE_URL}/api/user`;

export default function SignupScreen() {
  const { setToken } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSignup = async () => {
    setErrorMsg('');
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('ERROR: Passwords do not match!');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email: email.trim().toLowerCase(), 
          password, 
          recaptchaToken: 'custom_captcha_' + Date.now() 
        }),
      });
      const data = await res.json();
      if (data.success) {
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      
      <View style={styles.headerSection}>
        <HeaderIcon />
        <Animated.Text entering={FadeInDown.duration(600).delay(200)} style={styles.headerTitle}>
          Create Account
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(600).delay(300)} style={styles.headerSubtitle}>
          Join us today to book experts!
        </Animated.Text>
      </View>

      <Animated.View entering={SlideInUp.duration(600).damping(18)} style={styles.formSection}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={[styles.inputContainer, focusedInput === 'name' && styles.inputFocused]}>
              <Feather name="user" size={20} color={focusedInput === 'name' ? "#5F6FFF" : "#64748b"} style={styles.iconNode} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name..."
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(500)}>
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

          <Animated.View entering={FadeInDown.duration(400).delay(600)}>
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

          <Animated.View entering={FadeInDown.duration(400).delay(700)}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={[styles.inputContainer, focusedInput === 'confirm' && styles.inputFocused, errorMsg.includes('match') && styles.inputErrorOutline]}>
              <Feather name="shield" size={20} color={focusedInput === 'confirm' ? "#5F6FFF" : "#64748b"} style={styles.iconNode} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••••••"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedInput('confirm')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {!!errorMsg && (
            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorBox}>
              <Feather name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.duration(400).delay(800)}>
            <TouchableOpacity 
              style={[styles.submitBtn, (!email || !password || !name || !confirmPassword) && styles.submitBtnDisabled]} 
              onPress={handleSignup} 
              disabled={loading || !email || !password || !name || !confirmPassword}
            >
              {loading ? <ActivityIndicator color="#ffffff" /> : (
                <Text style={styles.submitBtnText}>Sign Up <Feather name="arrow-right" size={18} /></Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(900)}>
            <TouchableOpacity onPress={() => router.push('/login')} style={styles.footerLink}>
              <Text style={styles.footerText}>
                Already have an account? <Text style={styles.footerHighlight}>Sign In.</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </Animated.View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E2532',
  },
  headerSection: {
    flex: 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
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
    flex: 0.65,
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
  inputErrorOutline: {
    borderColor: '#ef4444',
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
    marginTop: 10,
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
    color: '#5F6FFF',
    fontFamily: 'Poppins_600SemiBold',
  }
});
