# Guía de Demostración y Defensa Oral (3 a 5 Minutos)
## Network QoS Monitor — Trabajo Práctico 5
**Licenciatura en Sistemas de Información — Desarrollo de Aplicaciones Móviles 2026**
**Facultad de Ciencia y Tecnología (FCyT) — UADER**

---

### Objetivo de la Defensa
Demostrar en vivo ante la cátedra el cumplimiento de los **Requisitos Funcionales (RF-01 a RF-09)**, la arquitectura desacoplada por debajo de las abstracciones estándar de React Native (módulo nativo en Kotlin para `TelephonyManager`, cálculo estricto de **Jitter según RFC 3550**, **throughput bidireccional** contra el backend de referencia en Node.js, **mapa de calor geoespacial** e **integración de muestreo en segundo plano**).

---

### Cronograma de Tiempos Sugerido (4 minutos en total)

| Minuto | Bloque | Qué mostrar en pantalla | Qué explicar verbalmente |
| :---: | :--- | :--- | :--- |
| **0:00 - 0:45** | **Introducción & Arquitectura** | Pantalla principal `Monitor` (`index.tsx`) | Presentar el proyecto, el stack (React Native, TypeScript, Kotlin, Node.js) y justificar por qué se requirió un módulo nativo custom para acceder a `TelephonyManager` (RSSI en dBm y operador). |
| **0:45 - 2:00** | **Test de Velocidad y Sondas Ping (RF-01, RF-02, RF-03)** | Pestaña `Speed & QoS` $\rightarrow$ Pulsar *"Iniciar Test"* | Mostrar el velocímetro en vivo, la fase de descarga y subida contra el backend propio, y la matriz de sondas contra Cloudflare, Google, OpenDNS y backend local calculando Min/Avg/Max RTT y Jitter RFC 3550. |
| **2:00 - 2:50** | **Mapa de Cobertura y Heatmap KDE (RF-04, RF-05)** | Pestaña `Cobertura` $\rightarrow$ Tocar marcadores y alternar Heatmap | Explicar la georreferenciación GPS automática, la proyección del mapa de calor con gradiente de semáforo según QoS, y el modal de inspección detallada de cada punto. |
| **2:50 - 3:35** | **Series Temporales, Filtros y Exportación (RF-06, RF-08, RF-09)** | Pestaña `Analíticas` $\rightarrow$ Filtros $\rightarrow$ Exportar CSV | Mostrar los gráficos de líneas temporales de latencia y throughput, aplicar un filtro por tipo de red (e.g. solo 4G), y abrir el modal de exportación mostrando la descarga del archivo CSV/JSON. |
| **3:35 - 4:15** | **Segundo Plano y Degradación (RF-07) & Cierre** | Pestaña `Ajustes` $\rightarrow$ Activar Muestreo y revisar umbrales | Explicar el servicio en background, los umbrales configurables (latencia > 200ms, jitter > 30ms, pérdida > 5%) y el disparo de alertas de degradación severa. |

---

### Guion Paso a Paso para la Presentación

#### Paso 1: Apertura y Arquitectura (0:00 - 0:45)
- **Acción:** Abrir la aplicación en la pestaña **Monitor**.
- **Voz del expositor:**
  > *"Buenas tardes profesores. Presentamos Network QoS Monitor, una aplicación móvil para monitoreo y diagnóstico de calidad de red en tiempo real. Como solicitaba la consigna, este proyecto va más allá de las abstracciones habituales de React Native: desarrollamos un módulo nativo propio en Kotlin que accede a `TelephonyManager` para extraer la potencia de radio celular en dBm (RSSI), nivel de señal en barras, el operador del módem y la tecnología celular activa (5G, 4G, 3G o WiFi), correlacionándolos con la ubicación GPS del usuario."*

#### Paso 2: Ejecución del Test QoS en Vivo (0:45 - 2:00)
- **Acción:** Tocar la pestaña **Speed & QoS** y presionar **"Iniciar Prueba QoS"**.
- **Voz del expositor:**
  > *"Aquí demostramos los requisitos RF-01, RF-02 y RF-03. Primero, el motor de sondeo emite ráfagas de paquetes de alta resolución contra cuatro hosts configurables: Cloudflare 1.1.1.1, Google DNS, Cisco OpenDNS y nuestro servidor QoS local.*
  > *Para medir el jitter no usamos una desviación estándar arbitraria, sino la fórmula matemática oficial del estándar IETF RFC 3550. Observen cómo en la tarjeta de cada host se calculan en vivo el RTT mínimo, promedio, máximo, el jitter y la pérdida de paquetes.*
  > *Inmediatamente después, el velocímetro pasa a la fase de Throughput: primero mide la velocidad de descarga consumiendo un flujo binario de tamaño fijo desde nuestro backend de referencia en Node.js, y luego realiza la fase de subida enviando un buffer binario determinista al endpoint de upload. Al finalizar, el sistema clasifica globalmente la sesión con una calificación QoS de semáforo (Excelente, Buena, Regular o Pobre)."*

#### Paso 3: Mapa de Cobertura Personal y Heatmap (2:00 - 2:50)
- **Acción:** Cambiar a la pestaña **Cobertura**. Alternar el botón **"Heatmap"** y tocar un marcador en el mapa.
- **Voz del expositor:**
  > *"En cumplimiento de los requisitos RF-04 y RF-05, cada medición efectuada se almacena con timestamp ISO y coordenadas satelitales GPS de alta precisión. En esta pantalla, nuestro motor proyecta un mapa de cobertura personal con una capa de calor basada en Kernel Density Estimation (KDE).*
  > *Los puntos verdes indican zonas de cobertura óptima con alto throughput y baja latencia, mientras que las tonalidades amarillas y rojas señalan áreas degradadas. Al tocar cualquier estación, se abre un modal con el desglose técnico completo: operador, RSSI, RTT, jitter y velocidades registradas en ese punto geográfico."*

#### Paso 4: Series Temporales, Filtros y Exportación (2:50 - 3:35)
- **Acción:** Ir a la pestaña **Analíticas**. Mostrar los gráficos SVG y luego abrir **"Filtros"** y **"Exportar"**.
- **Voz del expositor:**
  > *"Para el requisito RF-06, la pestaña Analíticas grafica la evolución temporal de la latencia y del throughput sesión a sesión mediante gráficos SVG vectoriales responsivos. Si cambiamos a la vista de lista, podemos visualizar el historial detallado.*
  > *Cumpliendo con RF-09, podemos filtrar por tipo de tecnología (5G, 4G, 3G o WiFi), por rango de fechas o por texto. Y para el requisito RF-08, al presionar 'Exportar', la aplicación genera al instante el archivo en formato CSV normalizado para Excel o en JSON estructurado para interoperabilidad con sistemas externos."*

#### Paso 5: Monitoreo en Segundo Plano y Conclusiones (3:35 - 4:15)
- **Acción:** Navegar a la pestaña **Ajustes**, mostrar el switch de **Monitoreo en Segundo Plano** y los campos de umbrales.
- **Voz del expositor:**
  > *"Finalmente, abordamos el requisito RF-07. En la pestaña Ajustes disponemos del orquestador de muestreo periódico en background, configurable a intervalos de 5, 15, 30 o 60 minutos.*
  > *El usuario puede personalizar los umbrales de alerta de latencia crítica, jitter máximo y pérdida de paquetes. Si durante un muestreo en segundo plano la red sufre una degradación severa, el sistema emite una notificación de advertencia inmediata.*
  > *Con esto completamos el 100% de los requisitos funcionales, técnicos y de arquitectura exigidos por la cátedra. Muchas gracias."*
