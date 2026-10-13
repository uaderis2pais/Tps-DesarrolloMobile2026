# TP1 — Contador con Temas & To-Do List con Persistencia

Aplicación móvil desarrollada con **React Native**, **Expo**, **Expo Router** y **TypeScript**, que incluye dos módulos principales: un contador interactivo con temas dinámicos y un gestor de tareas pendientes (To-Do List) con almacenamiento local offline.

---

## 📱 Módulos de la Aplicación

### 1. Contador Interactivo (`/`)
- **Estado Dinámico**:
  - Incremento con tope máximo.
  - Botón de reinicio a cero.
- **Soporte de Tema (Light / Dark)**:
  - Selector de tema interactivo con estilos adaptables en tiempo real (`useThemeStyles`).

### 2. To-Do List (`/explore`)
- **Gestión de Tareas**:
  - Agregar nuevas tareas.
  - Marcar como completada / desmarcar con tachado visual.
  - Edición en línea (inline edit) de texto de tareas existentes.
  - Eliminación de tareas con confirmación.
- **Filtros**:
  - Filtro por estado: *Todas*, *Activas*, *Completadas*.
- **Persistencia Offline**:
  - Almacenamiento local mediante `@react-native-async-storage/async-storage`.

---

## 🛠️ Instalación y Ejecución

### Requisitos previos
- **Node.js** (v18 o superior)
- **npm** o **yarn**
- Dispositivo móvil con la aplicación **Expo Go** (Android / iOS) o un emulador configurado.

### Pasos

1. Clonar el repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd <CARPETA_DEL_REPOSITORIO>
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npx expo start
   ```

4. **Visualización**:
   - Escanear el código QR con **Expo Go** en Android o la app Cámara en iOS.
   - O presionar `a` para emulador Android / `w` para versión Web.

---

## 📂 Estructura del Proyecto

```text
├── assets/                  # Fuentes, íconos e imágenes
├── src/
│   ├── app/                 # Rutas de Expo Router (_layout, index, explore)
│   ├── components/          # Componentes modulares (todo-screen, etc.)
│   ├── constants/           # Paleta de colores y temas
│   └── hooks/               # Custom hooks (useThemeStyles, etc.)
├── app.json                 # Configuración de Expo
├── package.json             # Dependencias del proyecto
└── tsconfig.json            # Configuración de TypeScript
```
