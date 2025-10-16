import AvatarImage from "@/components/avatar-image";
import { Colors } from "@/constants/theme";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const { signOut, userDoc, user } = useAuth();

  // Format join date
  const formatJoinDate = () => {
    if (!userDoc?.created_time) return "Member since 2024";

    const date = userDoc.created_time;
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    return `Member since ${month} ${year}`;
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/sign-in");
          } catch (error: any) {
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: C.screenBg },
      ]}
    >
      {/* Header with subtle decoration */}
      <View
        style={[styles.headerDecoration, { backgroundColor: C.tint + "10" }]}
      />

      {/* Title with elegant styling */}
      <Text style={[styles.title, { color: C.text }]}>My Account</Text>

      {/* Profile Card - Enhanced */}
      <View
        style={[
          styles.profileCard,
          { backgroundColor: C.surface, borderColor: C.surfaceBorder },
        ]}
      >
        <View style={styles.profileContent}>
          <AvatarImage
            uri={userDoc?.photo_url || user?.photoURL || null}
            name={userDoc?.display_name || user?.displayName || "User"}
            size={72}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: C.text }]}>
              {userDoc?.display_name || user?.displayName || "User"}
            </Text>
            <Text style={[styles.email, { color: C.textMuted }]}>
              {userDoc?.email || user?.email || "user@example.com"}
            </Text>
            <Text style={[styles.meta, { color: C.textMuted }]}>
              {formatJoinDate()}
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
            <Feather name="edit-2" size={16} color={C.tint} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Section - Refined */}
      <Text style={[styles.sectionLabel, { color: C.textMuted }]}>
        Account Settings
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: C.surface, borderColor: C.surfaceBorder },
        ]}
      >
        <RowItem
          icon={
            <MaterialIcons name="person-outline" size={20} color={C.tint} />
          }
          label="Personal Information"
          description="Update your profile details"
        />
        <Divider color={C.surfaceBorder} />
        <RowItem
          icon={<MaterialIcons name="book-online" size={20} color={C.tint} />}
          label="My Bookings"
          description="View your booking history and transactions"
          onPress={() => router.push("/my-bookings")}
        />
      </View>

      {/* Preferences Section - New */}
      <Text style={[styles.sectionLabel, { color: C.textMuted }]}>
        Preferences
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: C.surface, borderColor: C.surfaceBorder },
        ]}
      >
        <RowItem
          icon={
            <Ionicons name="notifications-outline" size={20} color={C.tint} />
          }
          label="Notifications"
          description="Customize your notification preferences"
        />
        <Divider color={C.surfaceBorder} />
        <RowItem
          icon={<Ionicons name="moon-outline" size={20} color={C.tint} />}
          label="Appearance"
          description="Light mode, dark mode, or system default"
        />
      </View>

      {/* Support Section - Enhanced */}
      <Text style={[styles.sectionLabel, { color: C.textMuted }]}>
        Help & Support
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: C.surface, borderColor: C.surfaceBorder },
        ]}
      >
        <RowItem
          icon={
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={C.tint}
            />
          }
          label="About Us"
          description="Learn more about our company"
        />
        <Divider color={C.surfaceBorder} />
        <RowItem
          icon={
            <Ionicons name="help-circle-outline" size={20} color={C.tint} />
          }
          label="Help Center"
          description="Find answers to common questions"
        />
        <Divider color={C.surfaceBorder} />
        <RowItem
          icon={
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color={C.tint}
            />
          }
          label="Contact Support"
          description="Get assistance from our team"
          onPress={() => router.push("/contact-support")}
        />
      </View>

      {/* Logout - Elegant styling */}
      <TouchableOpacity
        style={[
          styles.logoutCard,
          { backgroundColor: C.surface, borderColor: C.surfaceBorder },
        ]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <View style={styles.row}>
          <View style={styles.left}>
            <View
              style={[
                styles.logoutIconWrap,
                { backgroundColor: "rgba(239, 68, 68, 0.1)" },
              ]}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <Text style={[styles.logoutText, { color: "#ef4444" }]}>
              Sign Out
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Version info */}
      <Text style={[styles.versionText, { color: C.textMuted }]}>
        Version 1.0.0
      </Text>
    </ScrollView>
  );
}

function Divider({ color }: { color: string }) {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: color,
        marginLeft: 52,
      }}
    />
  );
}

function RowItem({
  icon,
  label,
  description,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onPress?: () => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: C.surfaceSoft }]}>
          {icon}
        </View>
        <View style={styles.labelContainer}>
          <Text style={[styles.rowLabel, { color: C.text }]}>{label}</Text>
          {description && (
            <Text style={[styles.rowDescription, { color: C.textMuted }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.icon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "ios" ? 60 : 30,
    padding: 0,
    flexGrow: 1,
    paddingBottom: 24,
  },
  headerDecoration: {
    height: 120,
    width: "100%",
    overflow: "hidden",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    opacity: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 20,
    paddingHorizontal: 20,
    fontFamily: "System",
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileContent: {
    flexDirection: "row",
    position: "relative",
  },
  avatar: {
    height: 72,
    width: 72,
    borderRadius: 36,
    backgroundColor: "#e5e7eb",
  },
  profileInfo: {
    marginLeft: 16,
    justifyContent: "center",
    flex: 1,
  },
  editButton: {
    position: "absolute",
    top: 0,
    right: 0,
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: "System",
  },
  email: {
    fontSize: 14,
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    opacity: 0.7,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    marginBottom: 24,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 10,
    marginTop: 6,
    paddingHorizontal: 20,
    fontFamily: "System",
  },
  row: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  labelContainer: {
    flex: 1,
  },
  iconWrap: {
    height: 40,
    width: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "System",
  },
  rowDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  logoutCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    marginBottom: 55,
    marginHorizontal: 20,
    marginTop: 8,
  },
  logoutIconWrap: {
    height: 40,
    width: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 8,
    marginBottom: 12,
  },
});
