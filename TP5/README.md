# 01 Network QoS Monitor — TP5
## Analizador y Visualizador de Calidad de Red Móvil en Tiempo Real con Mapeo de Cobertura Personal

**Licenciatura en Sistemas de Información — Desarrollo de Aplicaciones Móviles 2026**  
**Facultad de Ciencia y Tecnología (FCyT) — Universidad Autónoma de Entre Ríos (UADER)**

---

## 📌 Descripción del Proyecto
**Network QoS Monitor** es una aplicación móvil de ingeniería de telecomunicaciones construida con **React Native (Expo SDK 57)**, **TypeScript**, módulos nativos en **Kotlin (Android TelephonyManager)** y un backend de referencia en **Node.js/Express**.

La aplicación permite medir, persistir y representar geoespacialmente los parámetros críticos de **Calidad de Servicio (QoS)** y **Calidad de Experiencia (QoE)**:
1. **Detección de Portadora y Celda**: Operador (Carrier), tipo de red (5G NR, 4G LTE, 3G HSPA, WiFi), RSSI en dBm, nivel en barras (0 a 4) y unidades ASU.
2. **Sondas Multi-Host de Latencia**: Medición de RTT (mínimo, promedio, máximo), tasa de pérdida de paquetes y **Jitter estricto según la norma RFC 3550** contra 4 hosts configurables (Cloudflare, Google DNS, Cisco OpenDNS y Servidor QoS Local).
3. **Throughput de Red**: Test de ancho de banda bidireccional (Descarga y Subida en Mbps) con corrección de overhead y streaming progresivo en tiempo real.
4. **Georreferenciación y Heatmap Personal**: Proyección de mediciones sobre un mapa de calor dinámico (Kernel Density Estimation) coloreado según la calidad del enlace.
5. **Series Temporales y Analíticas**: Gráficos de líneas y áreas interactivas para análisis de evolución temporal de latencia y throughput por sesión.
6. **Muestreo en Segundo Plano con Alertas**: Servicio periódico configurable (5, 15, 30, 60 min) que evalúa degradaciones severas y emite notificaciones de advertencia.
7. **Exportación e Interoperabilidad**: Exportador universal a formatos **CSV** (compatible con Excel, pandas y QGIS) y **JSON**.

---

## 🏗️ Estructura del Repositorio

```text
TP5/
├── README.md                      # Guía de inicio rápido y visión general
├── DOCUMENTACION_TECNICA.md       # Documento técnico universitario completo
├── DEFENSA.md                     # Guion de defensa oral (3 a 5 minutos)
├── backend/                       # Backend de referencia para pruebas de Throughput
│   ├── src/
│   │   └── server.ts              # Servidor Express: /ping, /download, /upload, /telemetry
│   ├── Dockerfile                 # Contenedor Docker listo para producción
│   ├── docker-compose.yml         # Despliegue con 1 comando
│   ├── package.json
│   └── tsconfig.json
└── mobile/                        # Aplicación móvil React Native
    ├── app/                       # Enrutamiento basado en archivos (Expo Router)
    │   ├── _layout.tsx            # Layout raíz y tema oscuro
    │   └── (tabs)/
    │       ├── index.tsx          # Monitor / Dashboard en tiempo real (RF-01)
    │       ├── speedtest.tsx      # Test de Velocidad, RTT y Jitter (RF-02, RF-03)
    │       ├── map.tsx            # Mapa de Cobertura y Heatmap KDE (RF-04, RF-05)
    │       ├── history.tsx        # Analíticas, Series Temporales y Exportación (RF-06, RF-08, RF-09)
    │       └── settings.tsx       # Ajustes de Hosts, Umbrales y Segundo Plano (RF-07)
    ├── android/                   # Código nativo Android
    │   └── app/src/main/
    │       ├── AndroidManifest.xml # Permisos de telefonía, GPS y segundo plano
    │       └── java/com/networkqos/telephony/
    │           ├── TelephonyModule.kt # Puente Kotlin con TelephonyManager (RSSI, Carrier)
    │           └── TelephonyPackage.kt# Paquete React Native nativo
    ├── src/
    │   ├── native/                # Puente TypeScript con fallback multiplataforma
    │   ├── engine/                # Motores matemáticos de Ping, Throughput y QoS
    │   ├── storage/               # Persistencia local (Database) y Exportador (CSV/JSON)
    │   ├── geo/                   # Servicio GPS y Geocodificación
    │   ├── store/                 # Store reactivo de estado global (useQoSStore)
    │   └── components/            # Componentes visuales UI (Gauges, Charts, Heatmap)
    ├── app.json
    └── package.json
```

---

## 🚀 Guía de Instalación y Ejecución Paso a Paso

### 1. Iniciar el Backend de Referencia (Throughput & Ping)
El backend provee los endpoints para las pruebas de descarga fija (`/api/download`), subida de sumidero (`/api/upload`) y sondas de microsegundos (`/api/ping`).

```bash
# Navegar a la carpeta del backend
cd "TP5/backend"

# Instalar dependencias y compilar
npm install
npm run build

# Iniciar el servidor
npm start
```
*El backend escuchará en `http://localhost:3001`.*

Alternativamente, se puede ejecutar mediante **Docker**:
```bash
docker-compose up --build
```

---

### 2. Iniciar la Aplicación Móvil

```bash
# Abrir una nueva terminal y navegar a mobile
cd "TP5/mobile"

# Instalar dependencias
npm install

# Opción A: Ejecutar en el Navegador Web (Desarrollo y Presentación Inmediata)
npm run web

# Opción B: Ejecutar en Dispositivo Móvil vía Expo Go / Expo Dev Client
npx expo start
# Escanear el código QR con la cámara (iOS) o la app Expo Go (Android).

# Opción C: Compilar y Generar APK Instalable Standalone (Android)
npx eas build -p android --profile preview
# Genera un archivo .apk descargable e instalable en cualquier dispositivo sin tiendas.

# Opción D: Ejecutar en Emulador/Dispositivo Local con Módulos Nativos Kotlin
npx expo run:android
```

---

## 📊 Cobertura de Requisitos Funcionales

| Requisito | Descripción | Vista / Pantalla |
| :---: | :--- | :---: |
| **RF-01** | Detección de red activa (5G, 4G, 3G, WiFi), operador y RSSI en dBm | `Monitor (Tab 1)` |
| **RF-02** | Medición de RTT contra 3+ hosts (Cloudflare, Google, OpenDNS, Local) con Jitter RFC 3550 | `Speed & QoS (Tab 2)` |
| **RF-03** | Test de Throughput en Mbps de subida y bajada con velocímetro en tiempo real | `Speed & QoS (Tab 2)` |
| **RF-04** | Registro automático de mediciones con timestamp ISO y coordenadas GPS | `En cada test` |
| **RF-05** | Mapa interactivo con overlay de calor (Heatmap KDE) e inspección de puntos | `Cobertura (Tab 3)` |
| **RF-06** | Series temporales interactivas de latencia y throughput por sesión | `Analíticas (Tab 4)` |
| **RF-07** | Muestreo periódico en segundo plano con notificación de degradación | `Ajustes (Tab 5)` |
| **RF-08** | Exportador de historial completo a CSV (Excel) y JSON | `Analíticas (Tab 4)` |
| **RF-09** | Filtro multicriterio por tipo de red, ventana de fecha y búsqueda | `Analíticas (Tab 4)` |

---

## 📚 Documentación Adicional
- [`DOCUMENTACION_TECNICA.md`](file:///d:/Archivos%20Personales/Desktop/UNIVERSIDAD/Visual%20studio%20Code/Desarrollo%20app%20mobile/TP5/DOCUMENTACION_TECNICA.md): Especificación técnica exhaustiva, fórmulas de Jitter RFC 3550, código Kotlin nativo y arquitectura detallada.
- [`DEFENSA.md`](file:///d:/Archivos%20Personales/Desktop/UNIVERSIDAD/Visual%20studio%20Code/Desarrollo%20app%20mobile/TP5/DEFENSA.md): Guion cronometrado para la defensa oral de 3 a 5 minutos ante la cátedra.
