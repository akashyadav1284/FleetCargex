import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export default function LoginScreen({ navigation }: any) {
  const { login, loginWithGoogle } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '209884063738-okknacocdamdbio3pdr65mbmkh1o7418.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const handleLogin = async () => {
    if (!identifier || !password) {
      setErrorMsg('Please enter both Email/Phone and Password.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      await login(identifier, password);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || e.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo: any = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      const token = idToken || userInfo.idToken || userInfo.data?.accessToken || userInfo.accessToken;
      
      if (!token) {
        throw new Error('Google Sign-In did not return an auth token.');
      }
      
      const email = userInfo.data?.user?.email || userInfo.user?.email;
      const name = userInfo.data?.user?.name || userInfo.user?.name;

      await loginWithGoogle(token, email, name);
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        setErrorMsg('Sign-in cancelled.');
      } else if (e.code === statusCodes.IN_PROGRESS) {
        setErrorMsg('Sign-in in progress.');
      } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrorMsg('Google Play Services not available.');
      } else {
        setErrorMsg(e.message || 'Google Sign-in failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>Cargex</Text>
            <Text style={styles.subtitle}>Log in to request rides and manage cargo deliveries.</Text>
          </View>

          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Email or Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. user@example.com or +91..."
              placeholderTextColor={COLORS.muted}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={isLoading || isGoogleLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              activeOpacity={0.8}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={COLORS.foreground} />
              ) : (
                <View style={styles.googleButtonContent}>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  logo: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    marginTop: SPACING.xs,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    marginTop: SPACING.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.foreground,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    ...SHADOWS.md,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: SPACING.sm,
  },
  googleButtonText: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
});
