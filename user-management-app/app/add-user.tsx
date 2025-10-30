// app/add-user.tsx
import { View, Text } from 'react-native';
import AddEditUserForm from '../components/AddEditUserForm';

export default function AddUserScreen() {
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#F3F7FF' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40, textAlign: 'center' }}>Add New User</Text>
      <AddEditUserForm />
    </View>
  );
}