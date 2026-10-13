import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useThemeStyles, ThemeMode } from '@/hooks/useThemeStyles';

export default function HomeScreen() {
  const [count, setCount] = useState<number>(0);
  const [theme, setTheme] = useState<ThemeMode>('light');

  const { styles, colors } = useThemeStyles(theme);

  const isMaxReached = count >= 10;

  const handleIncrement = () => {
    if (!isMaxReached) {
      setCount((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.containerBg}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>01 - Contador</Text>
        <Text style={styles.headerSubtitle}>
          Práctica Base React Native: State & Dynamic Theme
        </Text>

        {/* Card Contenedor */}
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              Tema Activo: {theme === 'light' ? 'Claro' : 'Oscuro'}
            </Text>
          </View>

          {/* Valor del Contador Grande y Centrado */}
          <View style={styles.counterValueContainer}>
            <Text style={styles.counterValueText}>{count}</Text>
          </View>

          {/* Aviso Bonus de Límite (Al llegar a 10) */}
          {isMaxReached && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                ¡Límite máximo de 10 alcanzado!
              </Text>
            </View>
          )}

          {/* Grupo de Botones con Pressable y Feedback Visual */}
          <View style={styles.buttonGroup}>
            {/* Botón +1 */}
            <Pressable
              disabled={isMaxReached}
              onPress={handleIncrement}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
              style={({ pressed }) => [
                styles.actionButton,
                isMaxReached ? styles.buttonDisabled : styles.buttonPrimary,
                pressed && !isMaxReached && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}>
              <Text
                style={
                  isMaxReached ? styles.buttonTextDisabled : styles.buttonTextPrimary
                }>
                {isMaxReached ? 'Máximo alcanzado (+1)' : '+1 Incrementar'}
              </Text>
            </Pressable>

            {/* Botón Reset */}
            <Pressable
              onPress={handleReset}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
              style={({ pressed }) => [
                styles.actionButton,
                styles.buttonReset,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}>
              <Text style={styles.buttonTextReset}>Reset (0)</Text>
            </Pressable>

            {/* Botón Toggle Tema */}
            <Pressable
              onPress={handleToggleTheme}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
              style={({ pressed }) => [
                styles.actionButton,
                styles.buttonToggle,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}>
              <Text style={styles.buttonTextToggle}>
                {theme === 'light' ? 'Cambiar a Oscuro' : 'Cambiar a Claro'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
