# Documento Técnico de Arquitectura y Especificación de Diseño
## 01 Network QoS Monitor — Analizador y Visualizador de Calidad de Red Móvil en Tiempo Real
**Licenciatura en Sistemas de Información — Desarrollo de Aplicaciones Móviles 2026**
**Facultad de Ciencia y Tecnología (FCyT) — Sede Concepción del Uruguay**

---

### Resumen Ejecutivo
El presente documento describe la arquitectura de software, decisiones de ingeniería, fundamentos matemáticos y protocolos de comunicación implementados en **Network QoS Monitor** (TP5). La solución aborda la adquisición de métricas de calidad de servicio (QoS) y calidad de experiencia (QoE) en dispositivos móviles, correlacionando indicadores de radiofrecuencia celular (RSSI, RSRP, tipo de red, operador) con mediciones de rendimiento de capa de transporte y aplicación (latencia RTT, jitter según RFC 3550, tasa de pérdida de paquetes y throughput en Mbps), georreferenciadas con GPS y proyectadas en un mapa de calor personal interactivo.

---

## 1. Matriz de Requisitos y Cumplimiento

| ID | Requisito Funcional | Prioridad | Estado | Componente / Archivo Responsable |
| :--- | :--- | :---: | :---: | :--- |
| **RF-01** | Detectar y mostrar tipo de red activa y operador (cuando esté disponible) | **Alta** | **Completado** | `TelephonyModule.kt`, `TelephonyBridge.ts`, `SignalStrengthBadge.tsx` |
| **RF-02** | Medir RTT (ping) contra al menos 3 hosts configurables, mostrando min/avg/max/jitter | **Alta** | **Completado** | `PingEngine.ts` (RFC 3550), `HostPingCard.tsx`, `settings.tsx` |
| **RF-03** | Ejecutar un test de descarga y subida y calcular throughput en Mbps | **Alta** | **Completado** | `ThroughputEngine.ts`, `SpeedometerGauge.tsx`, `backend/server.ts` |
| **RF-04** | Registrar cada medición con timestamp y coordenadas GPS | **Alta** | **Completado** | `GeoLocationService.ts`, `Database.ts`, `useQoSStore.ts` |
| **RF-05** | Visualizar el historial en un mapa con heatmap de intensidad de señal/calidad | **Alta** | **Completado** | `CoverageHeatmap.tsx`, `map.tsx` |
| **RF-06** | Graficar series temporales de latencia y throughput por sesión | **Media** | **Completado** | `LatencyChart.tsx`, `ThroughputChart.tsx`, `history.tsx` |
| **RF-07** | Ejecutar mediciones periódicas en background y notificar degradaciones severas | **Media** | **Completado** | `BackgroundSampler.ts`, `QoSScorer.ts`, `AndroidManifest.xml` |
| **RF-08** | Exportar el historial de mediciones a CSV/JSON | **Baja** | **Completado** | `Exporter.ts`, `ExportModal.tsx` |
| **RF-09** | Filtrar el historial por tipo de red, rango de fechas y zona geográfica | **Baja** | **Completado** | `Database.ts`, `FilterModal.tsx` |

---

## 2. Arquitectura del Sistema en Capas

El sistema se estructura bajo una separación estricta de responsabilidades en 6 capas desacopladas:

```
+-----------------------------------------------------------------------------------+
|                            Capa de Presentación (UI)                              |
|   Monitor Dashboard   |  Speed & QoS Tester  |  Coverage Heatmap  |  Analytics   |
|   (index.tsx)         |  (speedtest.tsx)     |  (map.tsx)         |  (history)   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        Capa de Estado Reactivo (Store)                            |
|             useQoSStore (Gestión de estado global, listeners y acciones)          |
+-----------------------------------------------------------------------------------+
        |                           |                           |
        v                           v                           v
+-------------------+     +--------------------+     +---------------------+
| Capa de Medición  |     | Capa Geoespacial   |     | Capa de Persistencia|
| - PingEngine      |     | - GeoLocationSvc   |     | - Database (SQLite/ |
| - ThroughputEngine|     | - Reverse Geocode  |     |   AsyncStorage)     |
| - QoSScorer       |     | - Bounding Box     |     | - Exporter CSV/JSON |
| - BackgroundSample|     +--------------------+     +---------------------+
+-------------------+
        |
        v
+-----------------------------------------------------------------------------------+
|                             Capa de Puente Nativo                                 |
|            TelephonyBridge.ts  <---->  TelephonyModule.kt (Android Native)        |
|                                        (TelephonyManager, CellSignalStrength)     |
+-----------------------------------------------------------------------------------+
        |
        v
+-----------------------------------------------------------------------------------+
|                            Backend de Referencia                                  |
|            Node.js / Express (Payload streaming, upload sink, ping probe)          |
+-----------------------------------------------------------------------------------+
```

---

## 3. Capa de Puente Nativo: Módulo de Telefonía Celular

### 3.1 Integración con Android `TelephonyManager`
En Android, el acceso a las métricas del módem celular requiere interactuar directamente con `android.telephony.TelephonyManager`. Las abstracciones tradicionales de React Native (e.g. `NetInfo`) solo exponen si hay conexión WiFi o celular, pero **no proporcionan el RSSI (potencia en dBm), nivel de señal en barras, nivel ASU ni el tipo exacto de portadora de radio**.

Para resolver esto se desarrolló el módulo nativo en Kotlin:
- Archivo fuente: `mobile/android/app/src/main/java/com/networkqos/telephony/TelephonyModule.kt`
- Paquete registrado: `mobile/android/app/src/main/java/com/networkqos/telephony/TelephonyPackage.kt`

#### Métricas extraídas por el módulo nativo:
1. **Potencia de señal (RSSI / RSRP / RSRQ en dBm)**:
   - Para Android 10+ (API level 29 o superior): se invoca `telephonyManager.signalStrength?.cellSignalStrengths`, iterando sobre instancias polimórficas de `CellSignalStrengthLte`, `CellSignalStrengthNr` (5G New Radio), `CellSignalStrengthWcdma` y `CellSignalStrengthGsm`.
   - Se obtiene el valor absoluto en dBm (típicamente entre `-50 dBm` excelente y `-120 dBm` crítico/nulo).
2. **Nivel de Señal (Bars 0 a 4)**: Normalizado directamente por el framework del sistema operativo mediante `signalStrength.level`.
3. **Nivel ASU (Arbitrary Strength Unit)**: Representación lineal estándar utilizada en radiocomunicaciones celulares ($ASU = (dBm + 113) / 2$ para GSM/UMTS).
4. **Operador de Red (Carrier)**: Obtenido mediante `telephonyManager.networkOperatorName` y `telephonyManager.simOperatorName` (e.g., Personal, Claro, Movistar).
5. **Tecnología de Datos Activa**: Resolución de constantes mediante `telephonyManager.dataNetworkType`:
   - `NETWORK_TYPE_NR` $\rightarrow$ `"5G NR"`
   - `NETWORK_TYPE_LTE` $\rightarrow$ `"4G LTE"`
   - `NETWORK_TYPE_HSDPA`, `HSUPA`, `UMTS` $\rightarrow$ `"3G HSPA"`
   - `NETWORK_TYPE_EDGE`, `GPRS` $\rightarrow$ `"2G EDGE/GSM"`
6. **Listener Reactivo**: Implementación de `TelephonyCallback` (Android 12+, API 31+) y `PhoneStateListener` (versiones anteriores) para emitir el evento `onSignalStrengthChanged` a través del puente nativo hacia React Native.

---

## 4. Fundamentos Matemáticos y Protocolos de Medición

### 4.1 Medición de Latencia (RTT) y Jitter según RFC 3550 (RF-02)

Para evaluar la estabilidad de la conexión más allá de la latencia media, se implementó el algoritmo matemático estándar definido en el **IETF RFC 3550 (RTP: A Transport Protocol for Real-Time Applications)**.

#### Definiciones:
- **Round-Trip Time ($RTT_i$)**: Tiempo transcurrido en milisegundos desde que se emite la sonda hasta que se recibe el primer byte de respuesta:
  $$RTT_i = T_{recv, i} - T_{send, i}$$
- **Diferencia de tránsito entre paquetes consecutivos**:
  $$D(i-1, i) = RTT_i - RTT_{i-1}$$
- **Jitter Estadístico Acumulado ($J$)**:
  Filtro exponencial de primer orden con ganancia $\alpha = 1/16 = 0.0625$, que amortigua el ruido de medición transitorio:
  $$J_i = J_{i-1} + \frac{|D(i-1, i)| - J_{i-1}}{16}$$

#### Hosts de Sondeo Predeterminados:
1. `1.1.1.1` — Cloudflare Anycast Public DNS (Baja latencia global).
2. `8.8.8.8` — Google Public DNS Primary (Referencia global).
3. `208.67.222.222` — Cisco OpenDNS.
4. `http://localhost:3001/api/ping` — Servidor QoS de Referencia local con medición de timestamp a nivel de nanosegundos (`process.hrtime`).

---

### 4.2 Test de Throughput (Descarga y Subida en Mbps) (RF-03)

El Throughput representa el ancho de banda efectivo útil transmitido por unidad de tiempo:

$$\text{Throughput (Mbps)} = \frac{\text{Bytes Transferidos} \times 8}{\Delta t \times 1.000.000}$$

Donde $\Delta t = (t_{fin} - t_{inicio})$ medido en segundos utilizando la API de alta resolución `performance.now()`.

#### Procedimiento de Descarga:
1. El cliente solicita `GET /api/download?sizeMb=N` con cabeceras `Cache-Control: no-cache, no-store`.
2. El servidor responde con un stream binario pseudo-aleatorio no compresible de tamaño fijo (evitando sesgos por compresión GZIP de proxies intermedios).
3. El cliente consume el stream en bloques progresivos, recalculando el caudal instantáneo en cada chunk para actualizar en tiempo real el velocímetro visual.

#### Procedimiento de Subida:
1. El cliente genera un buffer binario determinista en memoria de tamaño $S$ (e.g. 1 MB a 2 MB).
2. Se emite un `POST /api/upload` con `Content-Type: application/octet-stream`.
3. El servidor recibe los bytes, computa el tiempo del socket en servidor y devuelve una verificación cruzada `serverMeasuredMbps` en el cuerpo de la respuesta JSON.

---

## 5. Visualización: Mapa de Cobertura y Heatmap KDE (RF-04, RF-05)

La visualización geoespacial correlaciona la latitud y longitud GPS de cada sesión con su calificación global de QoS.

### Algoritmo de Heatmap (Kernel Density Estimation - KDE):
Cada medición $m_k = (\text{lat}_k, \text{lng}_k, \text{QoS}_k)$ genera una función de densidad radial basada en gradientes concéntricos con decrecimiento no lineal:

$$I(x, y) = \sum_{k=1}^{N} w_k \cdot \exp\left(-\frac{(x - x_k)^2 + (y - y_k)^2}{2\sigma^2}\right)$$

Donde:
- $(x_k, y_k)$ son las coordenadas geográficas proyectadas en pantalla.
- $\sigma$ es el radio de influencia (kernel bandwidth).
- $w_k$ es el factor de peso según la calidad de red:
  - **Excelente (Verde `#10B981`)**: $w = 1.0$ (Señal fuerte $> -85$ dBm, RTT $< 45$ ms, Throughput $> 25$ Mbps).
  - **Buena (Azul `#3B82F6`)**: $w = 0.75$.
  - **Regular (Amarillo `#F59E0B`)**: $w = 0.50$.
  - **Pobre / Crítica (Rojo `#EF4444`)**: $w = 0.25$ (Degradación severa o pérdida de señal).

---

## 6. Muestreo Periódico en Segundo Plano y Notificaciones (RF-07)

El componente `BackgroundSampler.ts` implementa un orquestador no bloqueante para muestreo desatendido:
1. Se activa un temporizador configurable (5, 15, 30 o 60 minutos).
2. En cada ciclo, se obtienen las coordenadas satelitales y métricas de radio sin intervenir la UI del usuario.
3. Se ejecutan sondas sintéticas y se compara contra los **umbrales de degradación severa**:
   - Latencia media $> 200$ ms.
   - Jitter $> 30$ ms.
   - Pérdida de paquetes $> 5\%$.
   - Throughput de bajada $< 5$ Mbps.
   - Potencia de señal $\le -110$ dBm.
4. Si se detecta una degradación severa, se genera una alerta local notificando al usuario el motivo específico del fallo.

---

## 7. Persistencia y Exportación (RF-08, RF-09)

- **Persistencia Local (`Database.ts`)**: Los registros se guardan con formato estructurado, soportando indexación temporal y consultas por filtros:
  - Tipo de red (`5G`, `4G`, `3G`, `WIFI`).
  - Ventana temporal (`Hoy`, `7 días`, `30 días`, `Todo`).
  - Nivel mínimo de QoS y búsqueda semántica por operador o zona geográfica.
- **Exportación (`Exporter.ts`)**:
  - **CSV (RFC 4180)**: Con 21 columnas normalizadas compatibles con Microsoft Excel, pandas y QGIS para análisis GIS.
  - **JSON**: Payload jerárquico enriquecido con metadatos de exportación.
  - Descarga web o menú `Share` nativo en Android/iOS.

---

## 8. Backend de Referencia para Throughput

El backend está desarrollado en **Node.js + Express + TypeScript** y cuenta con despliegue en un solo paso mediante `Dockerfile` y `docker-compose.yml`:
- `GET /health`: Healthcheck y estado de servicio.
- `GET /api/ping`: Sonda rápida de microsegundos con timestamp en nanosegundos (`process.hrtime`).
- `GET /api/download?sizeMb=N`: Generador de payload binario en RAM para saturar el canal sin costo de CPU.
- `POST /api/upload`: Sumidero de bytes con cálculo de tasa del lado servidor (`serverMeasuredMbps`).
- `GET /api/servers`: Catálogo de hosts de prueba recomendados.
- `GET/POST /api/telemetry`: Ingesta y agregación remota de reportes de calidad.

Instrucciones completas de despliegue local, Docker y Cloud documentadas en [`TP5/backend/README.md`](file:///d:/Archivos%20Personales/Desktop/UNIVERSIDAD/Visual%20studio%20Code/Desarrollo%20app%20mobile/TP5/backend/README.md).

---

## 9. Entregables del Proyecto (Cumplimiento de Pautas de Cátedra)

| Entregable | Estado | Ubicación / Instrucción de Acceso |
| :--- | :---: | :--- |
| **Código fuente completo en repositorio** | ✅ Completo | Directorio `TP5/` (Frontend `mobile/` y microservicio `backend/`). |
| **Documento técnico detallado** | ✅ Completo | [`DOCUMENTACION_TECNICA.md`](file:///d:/Archivos%20Personales/Desktop/UNIVERSIDAD/Visual%20studio%20Code/Desarrollo%20app%20mobile/TP5/DOCUMENTACION_TECNICA.md) con fórmulas matemáticas, arquitectura y código Kotlin. |
| **Guion de defensa oral (3 a 5 min)** | ✅ Completo | [`DEFENSA.md`](file:///d:/Archivos%20Personales/Desktop/UNIVERSIDAD/Visual%20studio%20Code/Desarrollo%20app%20mobile/TP5/DEFENSA.md) con estructura temporal, diapositivas y preguntas frecuentes. |
| **Backend de referencia con despliegue** | ✅ Completo | En `TP5/backend/` con `Dockerfile`, `docker-compose.yml`, scripts `npm start` y guía [`backend/README.md`](file:///d:/Archivos%20Personales/Desktop/UNIVERSIDAD/Visual%20studio%20Code/Desarrollo%20app%20mobile/TP5/backend/README.md). |
| **APK / Build accesible vía Expo Dev Client** | ✅ Configurado | 1) Acceso instantáneo vía **Expo Go / Expo Dev Client** escaneando el código QR generado con `npx expo start`.<br>2) Generación de **APK instalable standalone** mediante EAS Build (`npx eas build -p android --profile preview`) con configuración oficial [`eas.json`](file:///d:/Archivos%20Personales/Desktop/UNIVERSIDAD/Visual%20studio%20Code/Desarrollo%20app%20mobile/TP5/mobile/eas.json). |

