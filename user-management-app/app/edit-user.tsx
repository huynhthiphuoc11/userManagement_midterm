import { View, Text } from 'react-native';
import AddEditUserForm from '../components/AddEditUserForm';

export default function EditUserScreen() {
  return (
    <View style={{ flex: 1, padding: 20 , backgroundColor: '#F3F7FF' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>Edit User</Text>
      <AddEditUserForm />
    </View>
  );
}
