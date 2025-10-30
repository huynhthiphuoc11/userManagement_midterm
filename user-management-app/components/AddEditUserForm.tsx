import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../utils/theme';
import { updateUser, fetchUserById } from '../services/api';

export default function AddEditUserForm() {
  const { id } = useLocalSearchParams();
  const isEdit = !!id;
  const router = useRouter();
  const { colors } = useTheme();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({});

  const { width: winW, height: winH } = Dimensions.get('window');
  const insets = useSafeAreaInsets();

  const isNotchDevice = React.useCallback(() => {
    if (Platform.OS !== 'ios') return false;
    if (insets && insets.top >= 44) return true;
    const pairs = [
      [812, 375],
      [896, 414],
      [844, 390],
      [926, 428],
    ];
    return pairs.some(([h, w]) => (winH === h && winW === w) || (winH === w && winW === h));
  }, [insets, winH, winW]);

  const isiPhoneXLike = React.useMemo(() => isNotchDevice(), [isNotchDevice]);

  const AVATAR_SIZE = React.useMemo(() => (isiPhoneXLike ? 150 : 130), [isiPhoneXLike]);
  const CAMERA_BADGE_SIZE = React.useMemo(() => (isiPhoneXLike ? 44 : 40), [isiPhoneXLike]);
  const SKELETON_AVATAR_SIZE = React.useMemo(() => AVATAR_SIZE - 30, [AVATAR_SIZE]);
  const INPUT_PADDING_VERTICAL = React.useMemo(() => (isiPhoneXLike ? 18 : 16), [isiPhoneXLike]);
  const SUBMIT_BUTTON_HEIGHT = React.useMemo(() => (isiPhoneXLike ? 64 : 56), [isiPhoneXLike]);

  useEffect(() => {
    if (isEdit) loadUser();
  }, [id]);

  const API_BASE = 'http://192.168.1.4:5000/api';

  const getImageUrl = (imgField: any) => {
    if (!imgField) return null;
    const base = 'http://192.168.1.4:5000';
    if (typeof imgField === 'string') {
      if (imgField.startsWith('http')) return imgField;
      if (imgField.startsWith('/uploads')) return `${base}${imgField}`;
      return `data:image/jpeg;base64,${imgField}`;
    }
    return null;
  };

  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await fetchUserById(id as string);
      const user = res.data;
      setUsername(user.username || '');
      setEmail(user.email || '');

      if (user.image) {
        setImage(getImageUrl(user.image));
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    Haptics.selectionAsync();
    Alert.alert('Chọn ảnh', 'Bạn muốn chụp ảnh mới hay chọn từ thư viện?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Chụp ảnh',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Cần quyền', 'Vui lòng cấp quyền Camera');
            return;
          }
          const cam = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!cam.canceled) {
            setImage(cam.assets[0].uri);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
      {
        text: 'Chọn từ thư viện',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Cần quyền', 'Vui lòng cấp quyền truy cập ảnh');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) {
            setImage(result.assets[0].uri);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ]);
  };

  // Validation helpers
  const emailIsValid = (e: string) => /\S+@\S+\.\S+/.test(e);

  // Animated error text component to reserve space and animate appearance
  const ErrorText: React.FC<{ message?: string | null }> = ({ message }) => {
    const anim = React.useRef(new Animated.Value(message ? 1 : 0)).current;

    useEffect(() => {
      Animated.timing(anim, {
        toValue: message ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, [message, anim]);

    const height = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
    const opacity = anim;

    return (
      <Animated.View style={{ height, overflow: 'hidden' }}>
        <Animated.Text style={[styles.errorText, { opacity }]}>{message || ''}</Animated.Text>
      </Animated.View>
    );
  };

  const validateField = (field: 'username' | 'email' | 'password', value: string) => {
    let msg = '';
    if (field === 'username') {
      if (!value || value.trim().length < 3) msg = 'Tên phải có ít nhất 3 ký tự';
    }
    if (field === 'email') {
      if (!value) msg = 'Email là bắt buộc';
      else if (!emailIsValid(value)) msg = 'Email không hợp lệ';
    }
    if (field === 'password') {
      if (!isEdit && (!value || value.length < 6)) msg = 'Mật khẩu phải có ít nhất 6 ký tự';
      if (isEdit && value && value.length > 0 && value.length < 6) msg = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    setErrors((p) => ({ ...p, [field]: msg }));
    return msg === '';
  };

  const validateAll = () => {
    const ok1 = validateField('username', username);
    const ok2 = validateField('email', email);
    const ok3 = validateField('password', password);
    return ok1 && ok2 && ok3;
  };

  const handleSubmit = async () => {
    if (!validateAll()) {
      Alert.alert('Lỗi', 'Vui lòng sửa các trường còn lỗi');
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {

      if (isEdit) {
        const payload: any = { username, email };
        if (password) payload.password = password;
        await updateUser(id as string, payload);

        if (image && image.startsWith('file://')) {
          const formData = new FormData();
          formData.append('image', {
            uri: image,
            name: `avatar-${Date.now()}.jpg`,
            type: 'image/jpeg',
          } as any);

          const res = await fetch(`${API_BASE}/uploads/user/${id}/image`, {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) throw new Error('Upload ảnh thất bại');
        }
      } else {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        if (image) {
          formData.append('image', {
            uri: image,
            name: `avatar-${Date.now()}.jpg`,
            type: 'image/jpeg',
          } as any);
        }
        const res = await fetch(`${API_BASE}/uploads/user-with-image`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Tạo người dùng thất bại');
      }
      Alert.alert('Thành công', isEdit ? 'Cập nhật thành công!' : 'Tạo thành công!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <View style={styles.skeletonContainer}>
        <View style={[styles.skeletonAvatar, { width: SKELETON_AVATAR_SIZE, height: SKELETON_AVATAR_SIZE, borderRadius: SKELETON_AVATAR_SIZE / 2 }]} />
        <View style={[styles.skeletonInput, { height: SUBMIT_BUTTON_HEIGHT }]} />
        <View style={[styles.skeletonInput, { height: SUBMIT_BUTTON_HEIGHT }]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 12, 24) }]}>
      <Pressable onPress={pickImage} style={styles.avatarPressable}>
        <View style={styles.avatarWrapper}>
          {image ? (
            <Image source={{ uri: image }} style={[styles.avatar, { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }]} />
          ) : (
            <View style={[styles.avatarPlaceholder, { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }]}>
              <Ionicons name="person" size={Math.round(AVATAR_SIZE * 0.36)} color="#ccc" />
            </View>
          )}
          <LinearGradient
            colors={['#007AFF', '#5856D6']}
            style={[styles.cameraBadge, { width: CAMERA_BADGE_SIZE, height: CAMERA_BADGE_SIZE, borderRadius: CAMERA_BADGE_SIZE / 2, bottom: Math.round(CAMERA_BADGE_SIZE * 0.2), right: Math.round(CAMERA_BADGE_SIZE * 0.2) }]}
          >
            <Ionicons name="camera" size={Math.round(CAMERA_BADGE_SIZE * 0.42)} color="white" />
          </LinearGradient>
        </View>
        <Text style={styles.avatarHint}>Nhấn để {image ? 'đổi' : 'chọn'} ảnh</Text>
      </Pressable>

      <View style={styles.form}>
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: focusedInput === 'username' ? '#007AFF' : (errors.username ? '#FF3B30' : colors.border) }]}>
          <Ionicons
            name="person-outline"
            size={20}
            color={focusedInput === 'username' ? '#007AFF' : '#aaa'}
            style={styles.inputIcon}
          />
          <TextInput
            style={[
              styles.input,
              { paddingVertical: INPUT_PADDING_VERTICAL },
              focusedInput === 'username' && styles.inputFocused,
            ]}
            placeholder="Tên người dùng"
            value={username}
            onChangeText={(v) => { setUsername(v); if (errors.username) validateField('username', v); }}
            onFocus={() => setFocusedInput('username')}
            onBlur={() => { setFocusedInput(null); validateField('username', username); }}
            autoCapitalize="none"
          />
        </View>
  <ErrorText message={errors.username} />

        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: focusedInput === 'email' ? '#007AFF' : (errors.email ? '#FF3B30' : colors.border) }]}>
          <Ionicons
            name="mail-outline"
            size={20}
            color={focusedInput === 'email' ? '#007AFF' : '#aaa'}
            style={styles.inputIcon}
          />
          <TextInput
            style={[
              styles.input,
              { paddingVertical: INPUT_PADDING_VERTICAL },
              focusedInput === 'email' && styles.inputFocused,
            ]}
            placeholder="email@example.com"
            value={email}
            onChangeText={(v) => { setEmail(v); if (errors.email) validateField('email', v); }}
            onFocus={() => setFocusedInput('email')}
            onBlur={() => { setFocusedInput(null); validateField('email', email); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
  <ErrorText message={errors.email} />

        {!isEdit && (
          <>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: focusedInput === 'password' ? '#007AFF' : (errors.password ? '#FF3B30' : '#E2E8F0') }]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={focusedInput === 'password' ? '#007AFF' : '#aaa'}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { paddingVertical: INPUT_PADDING_VERTICAL },
                  focusedInput === 'password' && styles.inputFocused,
                ]}
                placeholder="Mật khẩu"
                value={password}
                onChangeText={(v) => { setPassword(v); if (errors.password) validateField('password', v); }}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => { setFocusedInput(null); validateField('password', password); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 8 }}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={focusedInput === 'password' ? '#007AFF' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>
            <ErrorText message={errors.password} />
          </>
        )}
      </View>

      <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.8} style={[styles.submitWrap, loading && styles.submitButtonDisabled]}> 
        <LinearGradient
          colors={loading ? ['#ccc', '#aaa'] : ['#007AFF', '#5856D6']}
          style={[styles.submitButton, { height: SUBMIT_BUTTON_HEIGHT }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEdit ? 'Cập nhật' : 'Tạo người dùng'}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    flex: 1,
    padding: 24,
  },
  skeletonContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    marginBottom: 30,
  },
  skeletonInput: {
    height: 56,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    marginBottom: 16,
  },

  avatarPressable: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },

  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 18,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#333',
  },
  inputFocused: {
    borderColor: '#007AFF',
  },

  submitButton: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitWrap: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#FF3B30',
    marginTop: 0,
    fontSize: 13,
    lineHeight: 18,
  },
});