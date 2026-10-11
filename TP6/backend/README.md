# 🛰️ Network Diagnostics Suite — Backend de Sincronización (TP6)

Microservicio de sincronización para técnicos de campo desarrollado con **Node.js**, **Express** y **TypeScript**. Provee la API REST para el patrón **Outbox (cola de sincronización diferida)**, persistencia centralizada de reportes de instalación, fichas técnicas de equipos y recepción de diagnósticos SNMP/SSH.

---

## 📌 Endpoints de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/health` | Diagnóstico de estado del servicio, uptime y cantidad de registros en memoria. |
| `POST` | `/api/sync` | **Punto de sincronización Outbox por lotes (Batch)**. Procesa acciones encoladas (`INSTALLATION_REPORT`, `DIAGNOSTIC_RESULT`, etc.) con idempotencia. |
| `GET` | `/api/installations` | Consulta las instalaciones de telecomunicaciones registradas por los técnicos con GPS y notas. |
| `POST` | `/api/installations` | Creación directa de una instalación técnica individual. |
| `GET` | `/api/diagnostics` | Historial de diagnósticos remotos SNMP y SSH ejecutados en campo. |
| `GET` | `/api/devices/catalog` | Catálogo de fichas técnicas de fabricantes (Huawei, MikroTik, Cisco, ZTE) para asociación por QR/código de barras. |

---

## 🚀 Despliegue y Ejecución

### Opción 1: Ejecución Local con Node.js
```bash
cd TP6/backend
npm install
npm run build
npm start
```
El servidor escuchará en el puerto `3002` (`http://0.0.0.0:3002`).

### Opción 2: Despliegue con Docker y Docker Compose
```bash
cd TP6/backend
docker-compose up -d --build
```
Para ver los registros en tiempo real:
```bash
docker logs -f network_diagnostics_sync_backend
```
