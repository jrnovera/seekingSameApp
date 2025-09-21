import React from 'react';
import { StyleSheet, Text, View, ScrollView, useColorScheme, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import RemoteImage from '@/components/remote-image';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { signOut, userDoc } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/sign-in');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: C.screenBg }]}> 
      {/* Title */}
      <Text style={[styles.title, { color: C.text }]}>Settings</Text>

      {/* Profile Card */}
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <RemoteImage uri={null} style={styles.avatar} borderRadius={26} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.name, { color: C.text }]}>{userDoc?.display_name || 'User'}</Text>
            <Text style={[styles.email, { color: C.textMuted }]}>{userDoc?.email || 'user@example.com'}</Text>
            <Text style={[styles.meta, { color: C.textMuted }]}>Member since {userDoc?.created_time?.getFullYear() || '2024'}</Text>
          </View>
        </View>
      </View>

      {/* Account Section */}
      <Text style={[styles.sectionLabel, { color: C.textMuted }]}>ACCOUNT</Text>
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}> 
        <RowItem icon={<MaterialIcons name="person-outline" size={20} color={C.tint} />} label="Edit Profile" />
        <Divider color={C.surfaceBorder} />
        <RowItem icon={<MaterialIcons name="credit-card" size={20} color={C.tint} />} label="Transaction" />
      </View>

      {/* Support Section */}
      <Text style={[styles.sectionLabel, { color: C.textMuted }]}>SUPPORT</Text>
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}> 
        <RowItem icon={<Ionicons name="information-circle-outline" size={20} color={C.tint} />} label="About Us" />
        <Divider color={C.surfaceBorder} />
        <RowItem icon={<Ionicons name="help-circle-outline" size={20} color={C.tint} />} label="Contact Us" />
      </View>

      {/* Logout */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      > 
        <View style={styles.row}> 
          <View style={[styles.left, { gap: 12 }]}> 
            <Ionicons name="log-out-outline" size={20} color={C.accent2} />
            <Text style={[styles.logoutText, { color: C.accent2 }]}>Log Out</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.icon} />
        </View>
      </TouchableOpacity>

      
    </ScrollView>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: color, marginLeft: 52 }} />;
}

function RowItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: C.surfaceSoft }]}>{icon}</View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  avatar: {
    height: 52,
    width: 52,
    borderRadius: 26,
    backgroundColor: '#e5e7eb',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  email: {
    fontSize: 12,
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionLabel: {
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 8,
    marginTop: 6,
    letterSpacing: 1.1,
  },
  row: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    height: 36,
    width: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutText: {
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    fontSize: 12,
  },
});