import { Colors } from '@/constants/theme';
import { AntDesign } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ImageStyle, StyleProp, StyleSheet, Text, useColorScheme, View } from 'react-native';

export type RemoteImageProps = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  borderRadius?: number;
  children?: React.ReactNode;
};

export default function RemoteImage({ uri, style, borderRadius = 12, children }: RemoteImageProps) {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];
  const [error, setError] = useState(!uri);
  const [loading, setLoading] = useState(!!uri);

  // Debug logging
  React.useEffect(() => {
    if (uri) {
      console.log('RemoteImage: Loading image from URI:', uri);
    }
  }, [uri]);

  if (!uri || error) {
    return (
      <View
        style={[
          { backgroundColor: C.surfaceSoft, alignItems: 'center', justifyContent: 'center', borderRadius },
          style,
        ]}
      >
        <AntDesign name="picture" size={28} color={C.placeholder} />
        <Text style={{ marginTop: 6, fontSize: 12, color: C.placeholder }}>Image</Text>
        {children}
      </View>
    );
  }

  return (
    <View style={[{ borderRadius, overflow: 'hidden' }, style]}>
      {loading && (
        <View style={{ ...(StyleSheet.absoluteFillObject as any), alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.02)' }}>
          <ActivityIndicator size="small" color={C.accent2} />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[{ width: '100%', height: '100%' }]}
        onError={(e) => {
          console.log('RemoteImage: Error loading image:', uri, e.nativeEvent.error);
          setError(true);
          setLoading(false);
        }}
        onLoadEnd={() => {
          console.log('RemoteImage: Successfully loaded image:', uri);
          setLoading(false);
        }}
        onLoadStart={() => {
          console.log('RemoteImage: Started loading image:', uri);
          setLoading(true);
          setError(false);
        }}
        resizeMode="cover"
      />
      {children}
    </View>
  );
}
