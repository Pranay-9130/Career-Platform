import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { appStorage } from '../src/utils/storage';
import { APP_CONFIG } from '../src/constants/config';
import { useThemeStore } from '../src/store/themeStore';
import { typography, borderRadius } from '../src/constants/theme';
import {
  User,
  FileText,
  BrainCircuit,
  Briefcase,
  BookOpen,
  ArrowRight,
  Check,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Build Your Career Profile',
    desc: 'Showcase your engineering projects, degree coursework, and verified skills to stand out to hiring managers.',
    icon: User,
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    id: '2',
    title: 'Create ATS-Ready Resumes',
    desc: 'Craft structured, tailored tech resumes that pass Applicant Tracking Systems with maximum keyword relevance.',
    icon: FileText,
    color: '#06B6D4',
    bg: '#ECFEFF',
  },
  {
    id: '3',
    title: 'Discover Your Skill Gaps',
    desc: 'Compare your verified coursework against 13 industry role standards and follow deterministic learning milestones.',
    icon: BrainCircuit,
    color: '#6366F1',
    bg: '#EEF2FF',
  },
  {
    id: '4',
    title: 'Explore Internships & Jobs',
    desc: 'Discover verified engineering opportunities matched to your batch eligibility, degree, and preferred location.',
    icon: Briefcase,
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    id: '5',
    title: 'Prepare for Technical Placements',
    desc: 'Access curated role-based PDF libraries with technical question banks, OOP patterns, and system design notes.',
    icon: BookOpen,
    color: '#10B981',
    bg: '#ECFDF5',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const completeOnboarding = async () => {
    await appStorage.setItem(APP_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header: Skip Button */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <View style={[styles.miniLogo, { backgroundColor: colors.primary }]}>
            <Text style={styles.miniLogoText}>A</Text>
          </View>
          <Text style={[typography.h4, { color: colors.text }]}>AspirePath</Text>
        </View>

        <TouchableOpacity onPress={completeOnboarding} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[typography.bodyBold, { color: colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIdx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIdx);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const Icon = item.icon;
          return (
            <View style={[styles.slide, { width }]}>
              <View style={[styles.iconWrapper, { backgroundColor: item.bg }]}>
                <Icon size={56} color={item.color} />
              </View>
              <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginTop: 32 }]}>
                {item.title}
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: colors.textMuted, textAlign: 'center', marginTop: 12, paddingHorizontal: 32, lineHeight: 22 },
                ]}
              >
                {item.desc}
              </Text>
            </View>
          );
        }}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: currentIndex === idx ? colors.primary : colors.border,
                  width: currentIndex === idx ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleNext}
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
        >
          {currentIndex === SLIDES.length - 1 ? (
            <>
              <Text style={[typography.bodyBold, { color: '#FFFFFF', marginRight: 6 }]}>
                Get Started
              </Text>
              <Check size={18} color="#FFFFFF" />
            </>
          ) : (
            <>
              <Text style={[typography.bodyBold, { color: '#FFFFFF', marginRight: 6 }]}>
                Next
              </Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLogoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: borderRadius.md,
  },
});

