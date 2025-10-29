import { View, Text, FlatList, Image, TouchableOpacity, Alert, StyleSheet, TextInput, useColorScheme, Modal } from 'react-native';
import { useState, useCallback, useMemo, useRef } from 'react';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUsers, deleteUser } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../utils/theme';
// QR code renderer
// note: ensure `react-native-qrcode-svg` (and `react-native-svg`) are installed
// e.g. `expo install react-native-svg` (if using Expo) and `npm install react-native-qrcode-svg`
import QRCode from 'react-native-qrcode-svg';

type User = {
  _id: string;
  username: string;
  email?: string;
  image?: string;
};

export default function UserListScreen() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [qrUser, setQrUser] = useState<User | null>(null);
  const swipeRefs = useRef<Record<string, any>>({});

  // Bảo vệ route
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const uStr = await AsyncStorage.getItem('user');
        if (!uStr) {
          router.replace('/login');
        } else {
          try {
            const parsed = JSON.parse(uStr);
            const id = parsed && parsed._id ? parsed._id : null;
            setCurrentUserId(id);
            await loadUsers(id);
          } catch (e) {
            setCurrentUserId(null);
            await loadUsers();
          }
        }
      })();
    }, [])
  );

  const loadUsers = useCallback(async (excludeId?: string | null) => {
    try {
      const res = await fetchUsers();
      let list = res.data || [];
      if (excludeId) {
        list = list.filter((u: User) => u._id !== excludeId);
      }
      // client-side sort by username only
      list = list.sort((a: User, b: User) => {
        const A = (a.username || '').toLowerCase();
        const B = (b.username || '').toLowerCase();
        if (A < B) return sortDir === 'asc' ? -1 : 1;
        if (A > B) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
      setUsers(list);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
    } finally {
      // no refresh state
    }
  }, [sortDir]);

  const handleDelete = (id: string) => {
    Alert.alert('Xóa người dùng', 'Bạn có chắc chắn muốn xóa?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
            onPress: async () => {
          try {
            // close any open swipeable
            if (swipeRefs.current[id] && swipeRefs.current[id].close) swipeRefs.current[id].close();
            await deleteUser(id);
            loadUsers(currentUserId);
          } catch (err) {
            Alert.alert('Lỗi', 'Không thể xóa');
          }
        },
      },
    ]);
  };

  // removed manual pull-to-refresh and field-toggle button per UX preference

  const openQr = (user: User) => setQrUser(user);
  const closeQr = () => setQrUser(null);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('user');
          router.replace('/login');
        },
      },
    ]);
  };

  const getImageUri = (img?: string) => {
    if (!img) return 'https://via.placeholder.com/150/eeeeee/999999?text=No+Image';
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  // FILTER USERS THEO SEARCH
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        (user.email && user.email.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  return (
  <LinearGradient colors={colors.gradient as any} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
  <Text style={[styles.title, { color: colors.text }]}>Users List</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
          </TouchableOpacity>

          {/* sort-direction control removed per user preference */}

          <Link href="/add-user" asChild>
            <TouchableOpacity style={styles.addBtn}>
              <LinearGradient colors={['#A0BFFF', '#7C9EFF']} style={styles.addGradient}>
                <Ionicons name="add" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* SEARCH BAR */}
  <View style={[styles.searchContainer, focused && styles.searchFocused, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons
          name="search"
          size={20}
          color={focused ? '#007AFF' : '#aaa'}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Tìm kiếm người dùng..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.searchInput, { color: colors.text }]}
          placeholderTextColor={colors.subtext}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Swipeable
            ref={(ref) => { if (ref) swipeRefs.current[item._id] = ref; }}
            renderRightActions={() => (
              <RectButton style={styles.deleteAction} onPress={() => handleDelete(item._id)}>
                <Ionicons name="trash" size={24} color="#fff" />
              </RectButton>
            )}
          >
            <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }] }>
              <Image
                source={{ uri: getImageUri(item.image) }}
                style={styles.avatar}
                defaultSource={{ uri: 'https://via.placeholder.com/150/eeeeee/999999?text=?' }}
              />
              <View style={styles.userInfo}>
                <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
                <Text style={[styles.email, { color: colors.subtext }]}>{item.email || 'Chưa có email'}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => router.push(`/edit-user?id=${item._id}` as any)}
                  style={styles.actionBtn}
                >
                  <Ionicons name="create-outline" size={22} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openQr(item)} style={styles.actionBtn}>
                  <Ionicons name="qr-code-outline" size={22} color="#444" />
                </TouchableOpacity>
              </View>
            </View>
          </Swipeable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy người dùng' : 'Chưa có người dùng nào'}
            </Text>
          </View>
        }
      />

      <Modal visible={!!qrUser} transparent animationType="slide" onRequestClose={closeQr}>
        <View style={modalStyles.centered}>
          <View style={[modalStyles.card, { backgroundColor: colors.card }]}>
            <Text style={modalStyles.title}>QR cho {qrUser?.username}</Text>
            {/* QR Code component - requires react-native-qrcode-svg */}
            {qrUser && (
              <View style={{ alignItems: 'center', marginVertical: 12 }}>
                {/* Render QR for this user. Use a compact payload (id + username + email) */}
                {/* @ts-ignore - some environments may not have types for react-native-qrcode-svg */}
                <QRCode
                  value={JSON.stringify({ _id: qrUser._id, username: qrUser.username, email: qrUser.email })}
                  size={160}
                />
              </View>
            )}
            <View style={[modalStyles.modalBtnContainer, { backgroundColor: 'transparent' }]}>
              <LinearGradient colors={['#007AFF', '#005BDD']} style={modalStyles.modalBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <TouchableOpacity onPress={closeQr} style={modalStyles.modalBtnInner}>
                  <Text style={modalStyles.modalBtnText}>Đóng</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#7C9EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // SEARCH BAR
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  searchFocused: {
    borderColor: '#007AFF',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  clearBtn: {
    padding: 4,
  },

  // LIST
  list: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  username: {
    fontSize: 16.5,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
  },

  deleteAction: {
    backgroundColor: '#ff3b30',
    marginTop: 3,
    justifyContent: 'center',
    alignItems: 'center',
    width: 58,
    height: '84%',
    borderRadius: 4,
    // make the action fill the swipeable row height so it aligns with the card
    alignSelf: 'stretch',
    marginVertical: 0,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },

  // EMPTY STATE
  empty: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

const modalStyles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  modalBtnContainer: {
    marginTop: 18,
    borderRadius: 14,
    overflow: 'hidden',
    width: 140,
    alignSelf: 'center',
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  modalBtnInner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
