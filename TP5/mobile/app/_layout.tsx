import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQoSStore } from '../src/store/useQoSStore';

export default function RootLayout() {
  const store = useQoSStore();

  useEffect(() => {
    store.init();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0B0F19' },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
