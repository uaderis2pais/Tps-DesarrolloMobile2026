import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { colors } from '../../src/constants/theme';
import { useDiagnosticsStore } from '../../src/store/useDiagnosticsStore';

export default function TabsLayout() {
  const store = useDiagnosticsStore();
  const pendingCount = store.outboxStats.pending;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 10,
          ...Platform.select({
            web: {
              boxShadow: '0 -2px 10px rgba(0,0,0,0.5)',
            },
          }),
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          title: 'Escáner LAN',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-network" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="snmp"
        options={{
          title: 'SNMP MIB',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hardware-chip" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ssh"
        options={{
          title: 'SSH Shell',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="terminal" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="install"
        options={{
          title: 'Instalación',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="outbox"
        options={{
          title: 'Outbox',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.outboxColor,
            color: colors.white,
            fontSize: 10,
            fontWeight: 'bold',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cloud-upload" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
