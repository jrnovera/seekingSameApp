import { Colors } from '@/constants/theme';
import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, useColorScheme } from 'react-native';
import RemoteImage from './remote-image';

export type AvatarImageProps = {
  uri?: string | null;
  name?: string | null;
  style?: StyleProp<ImageStyle>;
  size?: number;
};

export default function AvatarImage({ uri, name, style, size = 52 }: AvatarImageProps) {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];
  
  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return '?';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    } else {
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    }
  };
  
  // If we have a valid URI, use RemoteImage
  if (uri) {
    return <RemoteImage uri={uri} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} borderRadius={size / 2} />;
  }
  
  // Otherwise, show initials
  return (
    <View
      style={[
        styles.initialsContainer,
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: C.surfaceSoft,
        },
        style,
      ]}
    >
      <Text style={[styles.initialsText, { fontSize: size * 0.4, color: C.text }]}>
        {name ? getInitials(name) : '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  initialsText: {
    fontWeight: '600',
  },
});
