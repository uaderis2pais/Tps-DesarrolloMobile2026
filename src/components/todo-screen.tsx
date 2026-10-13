import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export type FilterType = 'all' | 'active' | 'completed';

const STORAGE_KEY = '@todo_app_tasks';

export default function TodoScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [tasks, setTasks] = useState<TodoItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoaded, setIsLoaded] = useState(false);

  // State for inline editing (Bonus)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // 1. Cargar tareas guardadas al iniciar la app
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          const parsed = JSON.parse(jsonValue);
          if (Array.isArray(parsed)) {
            setTasks(parsed);
          }
        }
      } catch (e) {
        console.error('Error al cargar tareas desde AsyncStorage:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTasks();
  }, []);

  // 2. Persistir automáticamente al modificar las tareas (cuando isLoaded === true)
  useEffect(() => {
    if (!isLoaded) return;
    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (e) {
        console.error('Error al guardar tareas en AsyncStorage:', e);
      }
    };
    saveTasks();
  }, [tasks, isLoaded]);

  // Agregar nueva tarea (con .trim())
  const handleAddTask = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return; // No agregar tareas vacías

    const newTask: TodoItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setInputText('');
  };

  // Alternar completada / no completada
  const handleToggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  // Eliminar tarea
  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Long Press con Confirmación Alert (Bonus)
  const handleLongPressTask = useCallback(
    (item: TodoItem) => {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(`¿Deseas eliminar la tarea "${item.text}"?`);
        if (confirmed) {
          deleteTask(item.id);
        }
      } else {
        Alert.alert(
          'Eliminar Tarea',
          `¿Estás seguro de que deseas eliminar "${item.text}"?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: () => deleteTask(item.id),
            },
          ]
        );
      }
    },
    [deleteTask]
  );

  // Iniciar edición inline
  const handleStartEditing = useCallback((item: TodoItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  }, []);

  // Guardar edición inline
  const handleSaveEditing = useCallback(() => {
    if (!editingId) return;
    const trimmed = editingText.trim();

    if (!trimmed) {
      // Si deja el texto vacío al editar, se elimina la tarea
      deleteTask(editingId);
    } else {
      setTasks((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, text: trimmed } : item
        )
      );
    }
    setEditingId(null);
    setEditingText('');
  }, [editingId, editingText, deleteTask]);

  // Cancelar edición
  const handleCancelEditing = useCallback(() => {
    setEditingId(null);
    setEditingText('');
  }, []);

  // Filtrado de la lista
  const filteredTasks = tasks.filter((item) => {
    if (filter === 'active') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;

  // Render individual de cada tarea en el FlatList
  const renderItem = useCallback(
    ({ item }: { item: TodoItem }) => {
      const isEditing = editingId === item.id;

      if (isEditing) {
        return (
          <View style={[styles.taskCard, isDark && styles.taskCardDark, styles.editingCard]}>
            <TextInput
              style={[styles.editInput, isDark && styles.textDark]}
              value={editingText}
              onChangeText={setEditingText}
              autoFocus
              onSubmitEditing={handleSaveEditing}
              returnKeyType="done"
            />
            <View style={styles.editActions}>
              <Pressable
                onPress={handleSaveEditing}
                style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}>
                <Text style={styles.saveBtnText}>✓ Guardar</Text>
              </Pressable>
              <Pressable
                onPress={handleCancelEditing}
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}>
                <Text style={styles.cancelBtnText}>✕ Cancelar</Text>
              </Pressable>
            </View>
          </View>
        );
      }

      return (
        <Pressable
          onPress={() => handleToggleTask(item.id)}
          onLongPress={() => handleLongPressTask(item)}
          delayLongPress={350}
          android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
          style={({ pressed }) => [
            styles.taskCard,
            isDark && styles.taskCardDark,
            item.completed && (isDark ? styles.taskCardCompletedDark : styles.taskCardCompleted),
            pressed && styles.pressed,
          ]}>
          {/* Checkbox Icon Indicator */}
          <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
            {item.completed && <Text style={styles.checkboxCheckmark}>✓</Text>}
          </View>

          {/* Texto de la tarea */}
          <View style={styles.taskTextContainer}>
            <Text
              style={[
                styles.taskText,
                isDark && styles.textDark,
                item.completed && styles.taskTextCompleted,
              ]}>
              {item.text}
            </Text>
            <Text style={styles.hintSubtext}>
              {item.completed ? 'Completada (Tap: desmarcar)' : 'Pendiente (Tap: completar)'} • Long press: eliminar
            </Text>
          </View>

          {/* Botón rápido de edición inline (Bonus) */}
          <Pressable
            onPress={() => handleStartEditing(item)}
            style={({ pressed }) => [styles.editIconBtn, pressed && styles.pressed]}>
            <Text style={styles.editIconText}>Editar</Text>
          </Pressable>
        </Pressable>
      );
    },
    [editingId, editingText, isDark, handleToggleTask, handleLongPressTask, handleStartEditing, handleSaveEditing, handleCancelEditing]
  );

  const keyExtractor = useCallback((item: TodoItem) => item.id, []);

  if (!isLoaded) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={[styles.loadingText, isDark && styles.textDark]}>
          Cargando tareas guardadas...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textDark]}>02 - To-Do List</Text>
          <Text style={styles.subtitle}>Con FlatList + AsyncStorage</Text>
        </View>

        {/* Resumen de contadores */}
        <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
        </View>

        {/* Formulario para agregar tarea */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Escribe una nueva tarea..."
            placeholderTextColor={isDark ? '#94a3b8' : '#94a3b8'}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleAddTask}
            returnKeyType="done"
          />
          <Pressable
            onPress={handleAddTask}
            android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}>
            <Text style={styles.addBtnText}>+ Agregar</Text>
          </Pressable>
        </View>

        {/* Barra de Filtros */}
        <View style={styles.filterBar}>
          {(['all', 'active', 'completed'] as FilterType[]).map((f) => {
            const isActive = filter === f;
            const labels: Record<FilterType, string> = {
              all: `Todas (${totalCount})`,
              active: `Activas (${activeCount})`,
              completed: `Completadas (${completedCount})`,
            };
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterTab,
                  isActive && styles.filterTabActive,
                  isDark && !isActive && styles.filterTabDark,
                ]}>
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                    isDark && !isActive && styles.textDark,
                  ]}>
                  {labels[f]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Lista de Tareas con FlatList */}
        <FlatList
          data={filteredTasks}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
                No hay tareas {filter !== 'all' ? 'en esta categoría' : 'guardadas'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all'
                  ? 'Agrega tu primera tarea utilizando el campo de texto superior.'
                  : 'Cambia de filtro o agrega nuevas tareas.'}
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  keyboardAvoid: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  textDark: {
    color: '#f8fafc',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  summaryCardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#cbd5e1',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  inputDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    color: '#f8fafc',
  },
  addBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  filterTabDark: {
    backgroundColor: '#1e293b',
  },
  filterTabActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 90,
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  taskCardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  taskCardCompleted: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  taskCardCompletedDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxCheckmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  taskTextContainer: {
    flex: 1,
  },
  taskText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  hintSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  editIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  editIconText: {
    fontSize: 14,
  },
  editingCard: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  saveBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
});
