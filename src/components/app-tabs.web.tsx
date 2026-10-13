import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, useColorScheme, View, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.tabSlot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>01 Contador</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>02 To-Do List</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButton,
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.tabButtonContent,
          isFocused && (isDark ? styles.tabActiveDark : styles.tabActiveLight),
        ]}>
        <Text
          style={[
            styles.tabText,
            isDark ? styles.textDark : styles.textLight,
            isFocused && styles.tabTextActive,
          ]}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <View {...props} style={styles.tabListWrapper}>
      <View
        style={[
          styles.tabListInner,
          isDark ? styles.tabListInnerDark : styles.tabListInnerLight,
        ]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabSlot: {
    flex: 1,
    height: '100%',
  },
  tabListWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    zIndex: 1000,
  },
  tabListInner: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    padding: 6,
    gap: 6,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  tabListInnerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  tabListInnerDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  tabButton: {
    flex: 1,
  },
  tabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    gap: 8,
  },
  tabActiveLight: {
    backgroundColor: '#eff6ff',
  },
  tabActiveDark: {
    backgroundColor: '#334155',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
    color: '#2563eb',
  },
  textLight: {
    color: '#64748b',
  },
  textDark: {
    color: '#94a3b8',
  },
  pressed: {
    opacity: 0.75,
  },
});
