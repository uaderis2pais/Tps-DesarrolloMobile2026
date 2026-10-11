# Network Diagnostics Suite (TP6)
**Licenciatura en Sistemas de Información — Desarrollo de Aplicaciones Móviles 2026**  
**Facultad de Ciencia y Tecnología — UADER**  

Toolkit móvil de diagnóstico y auditoría de infraestructura de telecomunicaciones (ONTs, routers, switches, antenas) diseñado para técnicos de campo con soporte **Offline-First**, clientes de red de bajo nivel (SNMP UDP/161, SSH TCP/22) y generación de reportes certificados en PDF.

---

## Estructura del Proyecto

```
TP6/
├── backend/                  # Microservicio de sincronización (Node.js + Express)
│   ├── src/
│   │   └── server.ts         # Endpoints REST (/api/sync, /api/installations, /health)
│   ├── Dockerfile            # Contenedor Docker para despliegue
│   ├── docker-compose.yml    # Orquestación de contenedor en puerto 3002
│   └── package.json
│
├── mobile/                   # Aplicación móvil (React Native + Expo SDK 57)
│   ├── app/                  # Enrutamiento con Expo Router
│   │   ├── _layout.tsx       # Layout raíz con configuración de tema y estado
│   │   └── (tabs)/           # Navegación por pestañas
│   │       ├── _layout.tsx   # Barra de pestañas con contador de Outbox
│   │       ├── index.tsx     # Panel Principal (Dashboard) y switch offline
│   │       ├── discovery.tsx # Escáner de Red Local ARP / mDNS (RF-01)
│   │       ├── snmp.tsx      # Sondeo MIB-II con parser ASN.1/BER (RF-02)
│   │       ├── ssh.tsx       # Consola de diagnóstico SSH por vendor (RF-03)
│   │       ├── install.tsx   # Acta de instalación, QR, GPS y PDF (RF-04, 05, 06)
│   │       └── outbox.tsx    # Cola diferida Outbox e historial (RF-07, 08)
│   │
│   ├── src/
│   │   ├── constants/        # Paleta de colores telecom y OIDs MIB-II
│   │   ├── engine/           # Motores de bajo nivel (SNMP, SSH, GPS, QR, PDF, Outbox)
│   │   ├── storage/          # Base de datos local persistente
│   │   ├── store/            # Store reactivo global
│   │   └── types/            # Definiciones de TypeScript
│   ├── eas.json              # Configuración de compilación de APK autónomo
│   └── package.json
│
├── DOCUMENTACION_TECNICA.md  # Especificación técnica académica completa
├── DEFENSA.md                # Guión de defensa oral técnica (3-5 minutos)
└── README.md                 # Este manual
```

---

## 1. Puesta en Marcha Rápida

### Paso 1: Iniciar el Backend de Sincronización (Puerto 3002)

El backend recibe los lotes de la cola Outbox y expone el catálogo de auditorías técnicas.

```bash
cd backend
npm install
npm run dev
```

*Opcional con Docker:*
```bash
cd backend
docker compose up -d --build
```
> El servidor estará disponible en `http://localhost:3002` (Health check: `http://localhost:3002/health`).

---

### Paso 2: Iniciar la Aplicación Móvil

En una nueva terminal:

```bash
cd mobile
npm install
npm start
```

- **Para probar en el navegador web:** Presiona la tecla `w` en la consola (o ejecuta `npm run web`).
- **Para probar en emulador Android:** Presiona la tecla `a` (o ejecuta `npm run android`).
- **Para compilar el APK autónomo:** Ejecuta `eas build -p android --profile preview`.

---

## 2. Validación de Requisitos Funcionales

| Requisito | Pantalla / Módulo | Cómo probarlo |
|---|---|---|
| **RF-01 (Escaneo LAN)** | Pestaña *Escáner LAN* | Ingresar subred (`192.168.1`), presionar **Escanear**. Observar la barra de progreso en vivo y las tarjetas de dispositivos con sus MACs y fabricantes OUI. |
| **RF-02 (SNMP MIB-II)** | Pestaña *SNMP MIB* | Presionar **Enviar GetRequest (UDP/161)**. Observar el Uptime formateado, sysName, gráfico de tráfico de interfaces (Mbps) y desplegar el *Inspector de Tramas Crudas (ASN.1/BER)*. |
| **RF-03 (Consola SSH)** | Pestaña *SSH Shell* | Seleccionar fabricante (MikroTik / Cisco / Huawei / Linux), tocar un preset (ej: `/system resource print` o `display optical-info`) y verificar la respuesta de consola. |
| **RF-04 (Identificación QR)** | Pestaña *Instalación* | Tocar cualquier botón de preset QR (Huawei, MikroTik, Cisco) para cargar automáticamente la ficha técnica con sensibilidad óptica y puertos. |
| **RF-05 (Evidencia & GPS)** | Pestaña *Instalación* | Presionar **Fijar GPS** para georreferenciar en Concepción del Uruguay. Ajustar la atenuación óptica en dBm y verificar el Power Meter en tiempo real. |
| **RF-06 (Reporte PDF)** | Pestaña *Instalación* | Presionar **Guardar Instalación & Generar Reporte PDF**. Tocar en *Abrir / Compartir Documento PDF Generado* para ver el acta oficial formateada con firmas. |
| **RF-07 (Cola Outbox)** | Pestaña *Outbox* & Dashboard | Activar el switch de *Modo Offline* en el Dashboard. Registrar una instalación o consulta SNMP: ver cómo queda encolada como `PENDING`. Al desactivar el modo offline o tocar *Sincronizar Cola Ahora*, los lotes se transmiten al backend en el puerto `3002`. |
| **RF-08 (Historial Offline)** | Pestaña *Outbox* | Navegar por las pestañas *Historial SNMP* e *Historial SSH* para consultar diagnósticos anteriores guardados en la memoria local del equipo. |

---

## 3. Entregables Académicos Incluidos

1. **Código fuente completo:** En `mobile/` y `backend/`.
2. **Build de prueba (APK):** Perfil configurado en `eas.json` para generación con permisos nativos de red.
3. **Documento Técnico:** [`DOCUMENTACION_TECNICA.md`](file:///d:/Archivos%20Personales/Desktop/UNIVERSIDAD/Visual%20studio%20Code/Desarrollo%20app%20mobile/TP6/DOCUMENTACION_TECNICA.md) con detalle del parser ASN.1/BER, catálogo MIB-II, directrices de seguridad OWASP y arquitectura Outbox.
4. **Backend Mínimo:** Microservicio Express completo con soporte Docker en `backend/`.
5. **Guión de Defensa Oral:** [`DEFENSA.md`](file:///d:/Archivos%20Personales/Desktop/UNIVERSIDAD/Visual%20studio%20Code/Desarrollo%20app%20mobile/TP6/DEFENSA.md) con tiempos, pasos de la demo y respuestas a preguntas de los profesores.
