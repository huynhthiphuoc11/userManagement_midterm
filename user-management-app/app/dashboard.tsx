import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { fetchUsers } from '../services/api';
import { BarChart } from 'react-native-chart-kit';
import { Svg, G, Circle } from 'react-native-svg';
import useTheme from '../utils/theme';
import { Feather } from '@expo/vector-icons';

type User = {
  _id: string;
  username: string;
  email?: string;
  image?: string;
};

const screenWidth = Dimensions.get('window').width - 36;

export default function Dashboard() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchUsers();
        setUsers(res.data || []);
      } catch (e) {
        console.error('Failed to load users for dashboard', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const withImage = users.filter((u) => !!u.image).length;
    const gmail = users.filter((u) => (u.email || '').endsWith('@gmail.com')).length;

  const domainMap: Record<string, number> = {};
    users.forEach((u) => {
      const domain = u.email?.split('@')[1];
      if (domain) domainMap[domain] = (domainMap[domain] || 0) + 1;
    });

    const topDomains = Object.entries(domainMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return { total, withImage, gmail, topDomains };
  }, [users]);

  const DonutChart = ({
    value,
    total,
    size = 120,
    strokeWidth = 18,
    color = '#4CAF50',
    bgColor = '#eaeaea',
  }: {
    value: number;
    total: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    bgColor?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * radius;
    const percent = total > 0 ? Math.min(1, value / total) : 0;
    const dash = `${circumference * percent} ${circumference}`;

    return (
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          <Circle cx={cx} cy={cy} r={radius} stroke={bgColor} strokeWidth={strokeWidth} fill="none" />
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={dash}
          />
        </G>
      </Svg>
    );
  };

  const barData = useMemo(() => {
    const labels = stats.topDomains.map((d) => d[0]);
    const data = stats.topDomains.map((d) => d[1]);
    return { labels, datasets: [{ data }] };
  }, [stats]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.subtext, marginTop: 10 }}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18 }}>
      <Text style={[styles.header, { color: colors.text }]}>📊 Smart Dashboard</Text>

      
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Feather name="activity" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Total Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.withImage}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>With Image</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF8A65' }]}>{stats.gmail}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Gmail Users</Text>
          </View>
        </View>
      </View>

      
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Feather name="pie-chart" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Image Ratio</Text>
        </View>
        <View style={styles.donutRow}>
          <DonutChart value={stats.withImage} total={stats.total} color="#4CAF50" />
          <View>
            <Text style={[styles.percent, { color: colors.text }]}>
              {Math.round((stats.withImage / Math.max(1, stats.total)) * 100)}%
            </Text>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={{ color: colors.subtext }}>Has Image — {stats.withImage}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF8A65' }]} />
              <Text style={{ color: colors.subtext }}>
                No Image — {stats.total - stats.withImage}
              </Text>
            </View>
          </View>
        </View>
      </View>

      
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Feather name="bar-chart-2" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Email Domains</Text>
        </View>
        {barData.labels.length > 0 ? (
          <BarChart
            data={barData as any}
            width={screenWidth}
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(33, 150, 83, ${opacity})`,
              labelColor: () => colors.subtext,
              barPercentage: 0.6,
            }}
            verticalLabelRotation={25}
            style={{ marginTop: 10, borderRadius: 12 }}
          />
        ) : (
          <Text style={{ color: colors.subtext, textAlign: 'center' }}>No email data</Text>
        )}
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginTop: 40 , fontSize: 26, fontWeight: '800', textAlign: 'center', marginVertical: 20 },
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 13, marginTop: 4 },
  donutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  percent: { fontSize: 22, fontWeight: '800', marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3, marginRight: 6 },
});
