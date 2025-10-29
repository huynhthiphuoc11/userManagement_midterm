import { useColorScheme } from 'react-native';

export default function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const colors = {
    background: dark ? '#0b1220' : '#E0E7FF',
    surface: dark ? '#0f1724' : '#fff',
    card: dark ? '#0b1220' : '#fff',
    text: dark ? '#e6eef8' : '#1a1a1a',
    subtext: dark ? '#9aa6b2' : '#666',
    border: dark ? '#1f2937' : '#e8e8e8',
    primary: dark ? '#3b82f6' : '#007AFF',
    gradient: dark ? ['#071029', '#0b1a2f'] : ['#E0E7FF', '#d9e6ff'],
    cardShadow: dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.08)',
    iconBg: dark ? '#0f1724' : '#f8f8f8',
  } as const;

  return { colors, dark };
}
