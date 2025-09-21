import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import RemoteImage from '@/components/remote-image';

type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  time: string; // e.g., "2:14 PM"
  unread?: number;
  avatar?: string | null;
  online?: boolean;
};

const SAMPLE: ChatItem[] = [
  { id: '1', name: 'newuser', lastMessage: 'Is the room still available?', time: '2:14 PM', unread: 2, online: true },
  { id: '2', name: 'sally', lastMessage: 'Thanks! I will check it out.', time: '1:47 PM', unread: 0 },
  { id: '3', name: 'james', lastMessage: 'Can I book for next week?', time: 'Yesterday', unread: 1 },
  { id: '4', name: 'maria', lastMessage: 'See you then 👍', time: 'Mon', unread: 0, online: true },
];

export default function Chat() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  return (
    <View style={[styles.screen, { backgroundColor: C.screenBg }]}> 
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}> 
        <Ionicons name="search" size={18} color={C.icon} />
        <TextInput
          placeholder="Search conversations"
          placeholderTextColor={C.placeholder}
          style={styles.searchInput}
        />
        <TouchableOpacity activeOpacity={0.8}>
          <Ionicons name="options-outline" size={18} color={C.icon} />
        </TouchableOpacity>
      </View>

      {/* Chat list */}
      <FlatList
        data={SAMPLE}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: C.surfaceBorder }]}> 
            <View style={styles.avatarWrap}>
              <RemoteImage uri={item.avatar ?? null} style={styles.avatar} borderRadius={24} />
              {item.online && <View style={[styles.dot, { backgroundColor: C.accent2 }]} />}
            </View>
            <View style={styles.content}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: C.text }]}>{item.name}</Text>
                <Text style={[styles.time, { color: C.textMuted }]}>{item.time}</Text>
              </View>
              <View style={styles.msgRow}>
                <Text numberOfLines={1} style={[styles.msg, { color: C.textMuted }]}>{item.lastMessage}</Text>
                {item.unread && item.unread > 0 ? (
                  <View style={[styles.badge, { backgroundColor: C.tint }]}> 
                    <Text style={styles.badgeText}>{item.unread}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 24,
  },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    height: 10,
    width: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
  },
  time: {
    fontSize: 12,
  },
  msgRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  msg: {
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
