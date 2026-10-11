# Guión de Defensa Técnica Oral — TP6: Network Diagnostics Suite
**Licenciatura en Sistemas de Información — Desarrollo de Aplicaciones Móviles 2026**  
**Duración Estimada:** 4 a 5 minutos  
**Formato:** Exposición conceptual + Demostración funcional en vivo  

---

## 01. Apertura y Planteo del Problema (1 minuto)

> *"Buenas tardes profesores. Para este Trabajo Práctico desarrollamos **Network Diagnostics Suite**, un toolkit móvil de campo concebido específicamente para técnicos de telecomunicaciones que instalan y auditan equipamiento crítico: ONTs de fibra óptica, switches de distribución y routers.*
>
> *El principal desafío del escenario real de campo radica en que el técnico trabaja frecuentemente en sitios sin cobertura celular —como azoteas, subterráneos o salas de máquinas— y debe interactuar directamente con dispositivos locales que no exponen APIs web REST, sino protocolos de bajo nivel sobre sockets UDP y TCP.*
>
> *Para resolver esto, diseñamos una arquitectura en 6 capas gobernada por dos pilares fundamentales:*
> 1. *Un motor de red de bajo nivel con un parser propio de tramas ASN.1/BER para SNMP sobre UDP/161 y un cliente de consola SSH sobre TCP/22.*
> 2. *Una arquitectura **Offline-First** basada en el patrón **Outbox**, donde toda acción, auditoría o acta de instalación se persiste localmente y se sincroniza automáticamente por lotes al detectar conectividad con el NOC."*

---

## 02. Recorrido por la Arquitectura y Protocolos (1.5 minutos)

> *"Permítanme mostrarles brevemente cómo se resuelven los núcleos técnicos más complejos:*
>
> *En primer lugar, el **Sondeo SNMP (RF-02)**. Dado que en el ecosistema móvil no existen librerías de alto nivel maduras para construir tramas binarias de red sobre sockets crudos, implementamos nuestro propio parser ASN.1/BER. Construimos tripletas TLV (Type-Length-Value) a mano: codificamos el `GetRequest` con tag `0xA0`, los `Integer` con `0x02` y los OIDs con `0x06`. Al recibir el `GetResponse`, decodificamos el árbol MIB-II estándar: obtenemos el `sysUpTime`, `sysName`, `sysDescr` y la tabla `ifTable` con el tráfico en Mbps y errores de cada interfaz física.*
>
> *En segundo lugar, la **Consola SSH (RF-03)**. El técnico no debe tipear comandos complejos en una pantalla táctil. La suite incorpora un catálogo de presets por fabricante —MikroTik RouterOS, Cisco IOS, Huawei GPON y Linux— con emulación de terminal. Además, las credenciales no se almacenan nunca en texto plano; implementamos `CredentialVault` siguiendo las pautas de OWASP Mobile Security, asegurando las claves en el Keychain/Keystore del dispositivo.*
>
> *En tercer lugar, el **Patrón Outbox (RF-07)**. Las acciones técnicas transicionan por una máquina de estados estricta: `PENDING` -> `SYNCING` -> `SYNCED` o `FAILED`. Cada ítem tiene un UUID único para garantizar idempotencia y una política de reintentos con backoff exponencial. El componente `@react-native-community/netinfo` escucha el estado del enlace y dispara la sincronización en segundo plano sin bloquear jamás la experiencia de usuario."*

---

## 03. Demostración en Vivo del Flujo Operativo (2 minutos)

Durante la demostración práctica con la aplicación, seguir este orden de pasos:

### Paso 1: Escáner de Red Local (Pestaña "Escáner LAN" - RF-01)
- Ingresar a la pestaña **Escáner LAN**.
- Mostrar la subred configurada (`192.168.1`).
- Presionar **"Escanear"**: señalar la barra de progreso en tiempo real y el listado de equipos encontrados con sus direcciones IP, MAC y fabricantes detectados por OUI (Huawei, MikroTik, Cisco).
- Tocar sobre el equipo Huawei ONT para dejarlo como equipo objetivo.

### Paso 2: Sondeo MIB-II y Verificación Hexadecimal (Pestaña "SNMP MIB" - RF-02)
- Navegar a **SNMP MIB**.
- Presionar **"Enviar GetRequest (UDP/161)"**.
- Señalar los resultados decodificados: Uptime exacto formateado, descripción del sistema y la tabla de interfaces con medidores de tráfico de bajada y subida en Mbps.
- Desplegar el **"Inspector de Tramas Crudas (ASN.1/BER)"** y explicar a los docentes los primeros bytes en hexadecimal:
  > *"Aquí pueden ver la secuencia cruda: Tag `0x30` para la secuencia, `0x02` para la versión SNMPv2c, y la community string 'public' en ASCII."*

### Paso 3: Consola Remota SSH y Presets (Pestaña "SSH Shell" - RF-03)
- Navegar a **SSH Shell**.
- Cambiar el selector de fabricante a **MikroTik** y presionar el preset `/system resource print`.
- Luego cambiar a **Huawei** y presionar `display optical-info`.
- Mostrar en la consola la salida realista con la atenuación óptica en dBm y el estado O5 de la OLT.

### Paso 4: Alta de Instalación y Generación de PDF (Pestaña "Instalación" - RF-04, 05, 06)
- Navegar a **Instalación**.
- En la sección QR/Barras, tocar el botón del preset Huawei: mostrar cómo se asocia automáticamente a la ficha técnica con rango óptico y puertos.
- Presionar **"Fijar GPS"**: mostrar las coordenadas de alta precisión georreferenciadas en **Concepción del Uruguay**.
- Revisar el medidor visual de potencia óptica (Power Meter) en `-18.4 dBm` con validación de norma ITU-T G.984.
- Presionar **"Guardar Instalación & Generar Reporte PDF"**.
- Mostrar el botón para abrir/compartir el documento PDF generado con encabezado oficial, datos del abonado, sello y línea de firma.

### Paso 5: Demostración del Patrón Offline-First (Pestaña "Outbox" - RF-07)
- Volver al **Panel Principal (Dashboard)** y activar el switch **"Simulación de Cobertura Nula (Modo Offline)"**.
- Ir a la pestaña **Outbox**: señalar cómo las instalaciones y auditorías quedan en estado **"PENDING"** en la cola local.
- Asegurar que el backend de Node.js está corriendo en el puerto `3002` (`npm run dev`).
- Desactivar el switch de Modo Offline o presionar **"Sincronizar Cola Ahora"**:
- Mostrar cómo el estado cambia a **"SYNCING"** y luego a **"SYNCED"**, verificando en la consola del backend la ingesta de las acciones.

---

## 04. Preguntas Frecuentes de la Mesa Evaluadora y Respuestas Sugeridas

### P: *¿Por qué no utilizaron una librería de SNMP ya existente de npm?*
> **R:** *"En React Native no existen clientes SNMP puros basados en JavaScript que funcionen directamente sobre sockets crudos móviles sin requerir módulos nativos obsoletos o dependencias de Node.js (como `dgram` o `net`) que no están en el runtime móvil. Al implementar nuestro propio parser BER/ASN.1 logramos control absoluto sobre la serialización y decodificación TLV, asegurando portabilidad multiplataforma y entendimiento cabal de la RFC 1157 y RFC 1213."*

### P: *¿Cómo resuelven el almacenamiento seguro de credenciales según OWASP?*
> **R:** *"Implementamos la clase `CredentialVault` que delega la custodia de contraseñas y llaves de acceso en el hardware criptográfico del dispositivo móvil: el Android Keystore en Android y el Keychain Services en iOS. Nunca escribimos contraseñas en texto claro en `AsyncStorage` ni en archivos planos, mitigando los riesgos M1 (Insecure Data Storage) y M2 (Insecure Communication) del OWASP Mobile Top 10."*

### P: *¿Qué sucede si hay conflicto durante la sincronización diferida al reconectar?*
> **R:** *"Aplicamos el principio de idempotencia mediante identificadores UUID inmutables generados en el dispositivo al crear cada acción. El endpoint `/api/sync` del backend procesa lotes verificando si el ID ya fue consumido. En caso de actualizaciones simultáneas de estado sobre un mismo equipo, la política de resolución de conflictos es 'Last-Write-Wins' basada en el timestamp de generación del evento en campo."*

### P: *¿Por qué el proyecto requiere un build nativo (APK) en lugar de Expo Go estándar?*
> **R:** *"Porque las operaciones de red de bajo nivel sobre sockets TCP crudos (SSH puerto 22) y UDP crudos (SNMP puerto 161), así como los permisos avanzados de red local (`ACCESS_FINE_LOCATION`, `ACCESS_NETWORK_STATE`, sockets crudos), requieren módulos nativos compilados que exceden el sandbox cerrado de Expo Go. Para ello configuramos `eas.json` con el perfil `preview` para compilar el APK instalable de manera directa."*

---

## 05. Conclusión de Cierre (30 segundos)

> *"En síntesis, este desarrollo no solo cumple con cada uno de los 8 requerimientos funcionales solicitados en el enunciado, sino que entrega una solución robusta, arquitectónicamente desacoplada y lista para operar en condiciones reales de campo. Quedamos a disposición de cualquier consulta técnica adicional que deseen realizar."*
