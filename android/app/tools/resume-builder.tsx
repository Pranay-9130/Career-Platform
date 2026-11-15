import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumeApi } from '../../src/api/atsApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { Badge } from '../../src/components/common/Badge';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  User,
  GraduationCap,
  Code,
  Briefcase,
  Eye,
} from 'lucide-react-native';

const SECTIONS = ['Personal', 'Education', 'Skills', 'Experience', 'Projects'];

export default function ResumeBuilderScreen() {
  const { colors } = useThemeStore();
  const [activeSection, setActiveSection] = useState('Personal');

  // Form State
  const [fullName, setFullName] = useState('Pottipati Pranay Kumar Reddy');
  const [email, setEmail] = useState('pranay@example.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [college, setCollege] = useState('Vellore Institute of Technology');
  const [degree, setDegree] = useState('B.Tech Computer Science');
  const [gradYear, setGradYear] = useState('2026');
  const [cgpa, setCgpa] = useState('8.9 / 10');
  const [skills, setSkills] = useState(['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Tailwind CSS']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addSkill = () => {
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      setSkills([...skills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Resume Saved', 'Your resume draft has been successfully updated on AspirePath.');
    }, 600);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Mobile Resume Builder"
        subtitle="Craft ATS-ready engineering resumes"
        rightAction={
          <Button
            title={saving ? 'Saving...' : 'Save'}
            onPress={handleSave}
            size="sm"
            disabled={saving}
          />
        }
      />

      {/* Section Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.sectionTabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        {SECTIONS.map((sec) => (
          <TouchableOpacity
            key={sec}
            activeOpacity={0.7}
            onPress={() => setActiveSection(sec)}
            style={[
              styles.sectionTab,
              activeSection === sec && { borderBottomColor: colors.primary },
            ]}
          >
            <Text
              style={[
                typography.captionBold,
                { color: activeSection === sec ? colors.primary : colors.textMuted },
              ]}
            >
              {sec}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Personal Info */}
        {activeSection === 'Personal' && (
          <Card>
            <Text style={[typography.h4, { color: colors.text, marginBottom: 12 }]}>
              Contact & Identity
            </Text>
            <Input label="Full Name" value={fullName} onChangeText={setFullName} />
            <Input label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Input label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label="Location" placeholder="e.g. Bengaluru, India" />
          </Card>
        )}

        {/* Section 2: Education */}
        {activeSection === 'Education' && (
          <Card>
            <Text style={[typography.h4, { color: colors.text, marginBottom: 12 }]}>
              College & Degree
            </Text>
            <Input label="College / University" value={college} onChangeText={setCollege} />
            <Input label="Degree & Branch" value={degree} onChangeText={setDegree} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input label="Graduation Year" value={gradYear} onChangeText={setGradYear} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="CGPA / Percentage" value={cgpa} onChangeText={setCgpa} />
              </View>
            </View>
          </Card>
        )}

        {/* Section 3: Skills */}
        {activeSection === 'Skills' && (
          <Card>
            <Text style={[typography.h4, { color: colors.text, marginBottom: 12 }]}>
              Technical Skills ({skills.length})
            </Text>

            <View style={styles.addSkillRow}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Add skill (e.g. Docker, GraphQL)..."
                  value={newSkillInput}
                  onChangeText={setNewSkillInput}
                  onSubmitEditing={addSkill}
                />
              </View>
              <Button title="Add" onPress={addSkill} size="sm" style={{ marginLeft: 8, marginTop: -14 }} />
            </View>

            <View style={styles.skillsChipsWrap}>
              {skills.map((skill) => (
                <View
                  key={skill}
                  style={[styles.skillChip, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}
                >
                  <Text style={[typography.captionBold, { color: colors.primary }]}>{skill}</Text>
                  <TouchableOpacity onPress={() => removeSkill(skill)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Trash2 size={13} color={colors.textMuted} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Section 4: Experience */}
        {activeSection === 'Experience' && (
          <Card>
            <Text style={[typography.h4, { color: colors.text, marginBottom: 12 }]}>
              Work & Internships
            </Text>
            <Input label="Job Title" placeholder="e.g. Software Engineer Intern" />
            <Input label="Company Name" placeholder="e.g. TechCorp Solutions" />
            <Input label="Key Achievements / Description" placeholder="Engineered high-throughput REST APIs..." multiline numberOfLines={3} />
          </Card>
        )}

        {/* Section 5: Projects */}
        {activeSection === 'Projects' && (
          <Card>
            <Text style={[typography.h4, { color: colors.text, marginBottom: 12 }]}>
              Key Projects
            </Text>
            <Input label="Project Title" placeholder="e.g. AspirePath Career Platform" />
            <Input label="Tech Stack" placeholder="e.g. React Native, FastAPI, PostgreSQL" />
            <Input label="Project Summary" placeholder="Autonomous job matching platform with deterministic AI..." multiline numberOfLines={3} />
          </Card>
        )}

        {/* Quick Preview Card */}
        <Card style={[styles.previewCard, { backgroundColor: colors.surfaceCard }]}>
          <View style={styles.previewHeader}>
            <View>
              <Text style={[typography.captionBold, { color: colors.textMuted }]}>EXPORT OPTIONS</Text>
              <Text style={[typography.h4, { color: colors.text, marginTop: 2 }]}>Ready to Export</Text>
            </View>
            <Button
              title="Download PDF"
              onPress={() => Alert.alert('PDF Exported', 'Your ATS resume PDF has been generated and saved to your device.')}
              icon={<Download size={16} color="#FFFFFF" />}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTabs: {
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  sectionTab: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  addSkillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  previewCard: {
    padding: 16,
    marginTop: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
