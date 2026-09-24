import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';

interface SafeSvgImageProps {
  uri: string;
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ViewStyle>;
}

export const SafeSvgImage: React.FC<SafeSvgImageProps> = ({
  uri,
  width = '100%',
  height = '100%',
  style,
}) => {
  const [xml, setXml] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSvg() {
      if (!uri) {
        if (isMounted) setXml(null);
        return;
      }

      // If raw SVG string
      if (uri.trim().startsWith('<svg')) {
        if (isMounted) setXml(uri);
        return;
      }

      // If data URI
      if (uri.startsWith('data:image/svg+xml;utf8,')) {
        if (isMounted) setXml(decodeURIComponent(uri.replace('data:image/svg+xml;utf8,', '')));
        return;
      }

      // Local file URI
      if (uri.startsWith('file://')) {
        try {
          const info = await FileSystem.getInfoAsync(uri);
          if (info.exists) {
            const content = await FileSystem.readAsStringAsync(uri);
            if (isMounted) setXml(content);
            return;
          }
        } catch {
          // Silent fallback if file cannot be read
        }
      }

      // Remote URL or fallback
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        try {
          const res = await fetch(uri);
          if (res.ok) {
            const text = await res.text();
            if (isMounted) setXml(text);
            return;
          }
        } catch {
          // Silent fallback
        }
      }

      if (isMounted) setXml(null);
    }

    loadSvg();

    return () => {
      isMounted = false;
    };
  }, [uri]);

  if (!xml) {
    return <View style={[styles.container, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <SvgXml xml={xml} width={width} height={height} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
