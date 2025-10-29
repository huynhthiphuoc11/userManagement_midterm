import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, TextInput, ActivityIndicator, Keyboard, Image } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUser } from '../../services/api';

export default function AdminSettings() {
  const router = useRouter();
  const [user, setUser] = useState<{ username?: string; email?: string; image?: string } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('user');
      if (!raw) return router.replace('/login');
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        setUsername(parsed.username || '');
        setEmail(parsed.email || '');
      } catch (e) {
        router.replace('/login');
      }
    })();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('token');
          router.replace('/login');
        },
      },
    ]);
  };

  const startEdit = () => {
    if (!user) return;
    setUsername(user.username || '');
    setEmail(user.email || '');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!user) return Alert.alert('Lỗi', 'Không có thông tin người dùng');
    // validate
    let hasError = false;
    if (!username.trim()) {
      setUsernameError('Tên đăng nhập không được để trống');
      hasError = true;
    } else setUsernameError(null);
    const emailVal = email.trim();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (emailVal && !emailRegex.test(emailVal)) {
      setEmailError('Email không hợp lệ');
      hasError = true;
    } else setEmailError(null);
    if (hasError) return;
    setLoading(true);
    try {
      // if user has an _id, call API to persist
      const id = (user as any)._id;
      const payload = { username: username.trim(), email: email.trim() };
      if (id) {
        await updateUser(id, payload);
      }

      const updated = { ...(user as any), username: payload.username, email: payload.email };
      await AsyncStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setEditing(false);
      Alert.alert('Hoàn tất', 'Cập nhật thông tin thành công');
    } catch (e) {
      console.error('update admin', e);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Settings</Text>
      <View style={styles.card}> 
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <View style={styles.avatarCircle}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{(user?.username || user?.email || 'A').charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Signed in as</Text>
            {!editing ? (
              <Text style={styles.value}>{user?.username || user?.email || '—'}</Text>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Tên đăng nhập</Text>
                <TextInput
                  value={username}
                  onChangeText={(t) => { setUsername(t); if (t.trim()) setUsernameError(null); }}
                  placeholder="Tên đăng nhập"
                  style={[styles.input]}
                  autoCapitalize="none"
                />
                {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (!t || /^\S+@\S+\.\S+$/.test(t)) setEmailError(null); }}
                  placeholder="Email"
                  style={[styles.input, { marginTop: 4 }]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/index' as any)}>
        <Text style={styles.buttonText}>Manage Users</Text>
      </TouchableOpacity>

      {!editing ? (
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <TouchableOpacity style={[styles.button, { flex: 1, marginRight: 8 }]} onPress={startEdit}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.warn, { flex: 1 }]} onPress={handleLogout}>
            <Text style={[styles.buttonText, { color: 'white' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <TouchableOpacity style={[styles.button, { flex: 1, marginRight: 8, backgroundColor: '#6B7280' }]} onPress={cancelEdit} disabled={loading}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={saveEdit} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Save</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#F7F9FF' },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: {
    backgroundColor: '#f5f6fb',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6EEF9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 56, height: 56 },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: '#0b1220' },
  fieldLabel: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  errorText: { color: '#ff3b30', marginTop: 6, fontSize: 12 },
  card: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { color: '#666', fontSize: 14 },
  value: { fontSize: 16, fontWeight: '600' },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: 'white', fontWeight: '700' },
  warn: { backgroundColor: '#ff3b30' },
});
