import { useColorScheme } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeColors = {
  background: string;
  surface: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  gradient: string[];
  primary?: string;
  cardShadow?: string;
  iconBg?: string;
};

const light: ThemeColors = {
  background: '#F5F7FB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#111827',
  subtext: '#6B7280',
  border: '#E6E9F2',
  gradient: ['#F8FAFF', '#EEF3FF'],
  primary: '#007AFF',
  cardShadow: 'rgba(0,0,0,0.08)',
  iconBg: '#F8F8F8',
};

const dark: ThemeColors = {
  background: '#0B1220',
  surface: '#0F1724',
  card: '#121213ff',
  text: '#F8FAFC',
  subtext: '#9CA3AF',
  border: '#162029',
  gradient: ['#071226', '#0B1B2E'],
  primary: '#3B82F6',
  cardShadow: 'rgba(0,0,0,0.6)',
  iconBg: '#0F1724',
};

export default function useTheme() {
  const systemScheme = useColorScheme();

  const THEME_KEY = 'app_theme_preference';

  // override: 'light' | 'dark' | null (null = follow system)
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_KEY)
      .then((v) => {
        if (!mounted) return;
        if (v === 'light' || v === 'dark') setOverride(v as 'light' | 'dark');
        else setOverride(null);
      })
      .catch(() => {
        if (mounted) setOverride(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const scheme = override ?? systemScheme;
  const isDark = scheme === 'dark';
  const colors: ThemeColors = isDark ? dark : light;

  const setTheme = useCallback(async (mode: 'light' | 'dark' | 'system') => {
    try {
      if (mode === 'system') {
        await AsyncStorage.removeItem(THEME_KEY);
        setOverride(null);
      } else {
        await AsyncStorage.setItem(THEME_KEY, mode);
        setOverride(mode);
      }
    } catch (e) {
      // ignore persistence errors
      setOverride(mode === 'system' ? null : mode);
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  return { scheme, colors, isDark, setTheme, toggle } as const;
}
