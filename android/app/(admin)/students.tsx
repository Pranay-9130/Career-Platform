import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { adminApi, StudentAdminItem } from '../../src/api/adminApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Skeleton } from '../../src/components/common/Skeleton';
import { Users, Search, Mail, Calendar, CheckCircle2 } from 'lucide-react-native';

export default function AdminStudentsScreen() {
  const { colors } = useThemeStore();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: students, isLoading, refetch } = useQuery<StudentAdminItem[]>({
    queryKey: ['admin-students-list'],
    queryFn: () => adminApi.getStudents(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredStudents = useMemo(() => {
    const list = Array.isArray(students) ? students : [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    );
  }, [students, search]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text }]}>Students Directory</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {filteredStudents.length} verified accounts in database
        </Text>
      </View>

      {/* Search Input */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          placeholder="Search by student name or email..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={80} borderRadiusVal={12} />
            <Skeleton height={80} borderRadiusVal={12} />
            <Skeleton height={80} borderRadiusVal={12} />
          </View>
        ) : filteredStudents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Users size={36} color={colors.textMuted} />
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 8 }]}>No Students Found</Text>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {filteredStudents.map((s) => (
              <Card key={s.id} style={styles.studentCard}>
                <View style={styles.studentTopRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>
                      {s.full_name ? s.full_name.charAt(0).toUpperCase() : 'S'}
                    </Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={1}>
                      {s.full_name}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {s.email}
                    </Text>
                  </View>

                  <Badge
                    label={s.role}
                    variant={s.role === 'ADMIN' ? 'primary' : 'success'}
                  />
                </View>

                {s.headline ? (
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 6 }]} numberOfLines={1}>
                    {s.headline}
                  </Text>
                ) : null}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  studentCard: {
    padding: 14,
    marginBottom: 0,
  },
  studentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  avatarInitial: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 16,
  },
});
