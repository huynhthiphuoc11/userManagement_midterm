import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../services/api';
import { socialLogin } from '../services/api';
import * as AuthSession from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../utils/theme';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
    
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (res.data?.success) {
        await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
        if (res.data.token) await AsyncStorage.setItem('token', res.data.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Lỗi', res.data?.message || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const API_BASE = 'http://192.168.1.4:5000/api';

  const GOOGLE_CLIENT_ID = '<GOOGLE_CLIENT_ID_HERE>';
  const FACEBOOK_APP_ID = '<FACEBOOK_APP_ID_HERE>';

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true } as any);
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=${encodeURIComponent('profile email')}`;

  const result = await (AuthSession as any).startAsync({ authUrl });
      if (result.type === 'success' && (result as any).params?.access_token) {
        const accessToken = (result as any).params.access_token as string;
        const resp = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
        const profile = await resp.json();
        const email = profile.email;
        const name = profile.name;
        const picture = profile.picture;
        const backendRes = await socialLogin({ provider: 'google', email, username: name, image: picture });
        if (backendRes.data?.success) {
          await AsyncStorage.setItem('user', JSON.stringify(backendRes.data.user));
          if (backendRes.data.token) await AsyncStorage.setItem('token', backendRes.data.token);
          router.replace('/(tabs)');
        } else {
          Alert.alert('Lỗi', backendRes.data?.message || 'Đăng nhập bằng Google thất bại');
        }
      } else {
        // cancelled or error
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const signInWithFacebook = async () => {
    try {
      setLoading(true);
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true } as any);
      const authUrl = `https://www.facebook.com/v10.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=${encodeURIComponent('email,public_profile')}`;

  const result = await (AuthSession as any).startAsync({ authUrl });
      if (result.type === 'success' && (result as any).params?.access_token) {
        const accessToken = (result as any).params.access_token as string;
        const resp = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
        );
        const profile = await resp.json();
        const email = profile.email;
        const name = profile.name;
        const picture = profile.picture?.data?.url;
        const backendRes = await socialLogin({ provider: 'facebook', email, username: name, image: picture });
        if (backendRes.data?.success) {
          await AsyncStorage.setItem('user', JSON.stringify(backendRes.data.user));
          if (backendRes.data.token) await AsyncStorage.setItem('token', backendRes.data.token);
          router.replace('/(tabs)');
        } else {
          Alert.alert('Lỗi', backendRes.data?.message || 'Đăng nhập bằng Facebook thất bại');
        }
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Facebook login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
  <LinearGradient colors={['#F3F7FF', '#E6F0FF']} style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.centerWrap} keyboardShouldPersistTaps="handled">
          <View style={[styles.cardLarge, { backgroundColor: colors.card, borderColor: colors.border }] }>

            {/* Illustration */}
            <View style={styles.illustrationContainer}>
              <Image
                source={require('../assets/1.png')} // Thay bằng ảnh của bạn
                // source={{ uri: 'https://example.com/illustration.png' }}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            <Text style={[styles.heroTitle, { color: colors.text }]}>Sign In</Text>
            <Text style={[styles.heroSubtitle, { color: colors.subtext }]}>Enter to continue</Text>

            {/* Username Input */}
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                placeholder="User name"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                style={[styles.input, { color: colors.text }]}
                placeholderTextColor={colors.subtext}
              />
            </View>

            {/* Password Input */}
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={[styles.input, { color: colors.text }]}
                placeholderTextColor={colors.subtext}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Forget Password */}
            <TouchableOpacity style={styles.forgotContainer}>
              <Text style={styles.forgotText}>Forget password</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.loginBtnContainer}>
              <LinearGradient
                colors={[colors.primary, '#005BDD']}
                style={styles.loginBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginBtnText}>{loading ? 'Logging in...' : 'Login'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Or Continue */}
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>Or Continue with</Text>
              <View style={styles.orLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialBtn} onPress={signInWithGoogle}>
                <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 8 }} />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialBtn} onPress={signInWithFacebook}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" style={{ marginRight: 8 }} />
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Haven't any account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup' as any)}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerWrap: {
    marginTop: 15,
    width: 377,
    height: 710,
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  cardLarge: {
    
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
    alignSelf: 'stretch',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -10,
  },
  illustration: {
    width: '80%',
    maxWidth: 300,
    height: 180,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtnContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  loginBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    marginHorizontal: 12,
    color: '#94A3B8',
    fontSize: 13,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#64748B',
    fontSize: 13,
  },
  signupLink: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
});