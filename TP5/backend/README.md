# 📡 Backend de Referencia para Medición de Throughput y QoS

Microservicio de telecomunicaciones de alto rendimiento construido con **Node.js**, **Express** y **TypeScript**. Actúa como servidor de referencia (*Anchor Node*) para pruebas de latencia RTT, jitter, absorción de subida y saturación de descarga para la aplicación móvil **Network QoS Monitor** (TP5).

---

## 🚀 Endpoints de Telecomunicaciones

El servicio expone los siguientes endpoints optimizados para benchmarks de red:

| Método | Endpoint | Parámetros | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Ninguno | Estado del servicio, versión, timestamp y uptime en segundos. |
| `GET` | `/api/ping` | `_ts` (opcional) | Sonda de latencia de ultra-baja latencia con marca de tiempo en nanosegundos (`process.hrtime`). |
| `GET` | `/api/download` | `sizeMb` (1 a 20) | Genera y transmite un flujo de bytes aleatorio pre-almacenado en RAM (1 MB chunk) para saturar el canal de bajada sin cuellos de botella de CPU. |
| `POST` | `/api/upload` | Binario octet-stream | Sumidero de datos de alta velocidad. Mide bytes recibidos, duración y calcula la tasa de subida medida del lado servidor (`serverMeasuredMbps`). |
| `GET` | `/api/servers` | Ninguno | Catálogo de nodos de prueba disponibles y capacidades de red. |
| `POST` | `/api/telemetry` | JSON `TelemetryRecord` | Ingesta de métricas de sesiones móviles completadas para consolidación analítica. |
| `GET` | `/api/telemetry` | Ninguno | Resumen agregado de métricas (promedios de velocidad, latencia y lista de últimas 100 mediciones). |

---

## 🛠️ Instrucciones de Despliegue

### Opción 1: Despliegue Local con Node.js (Desarrollo y Pruebas)

#### Requisitos
* Node.js v18+ o v20+
* npm v9+

```bash
# 1. Ingresar al directorio del backend
cd TP5/backend

# 2. Instalar dependencias
npm install

# 3. Compilar el código TypeScript
npm run build

# 4. Iniciar el servidor
npm start
```
El servidor quedará escuchando en `http://0.0.0.0:3001` (accesible tanto desde `localhost:3001` como desde cualquier dispositivo móvil conectado a la red local Wi-Fi mediante la IP de tu computadora, ej: `http://192.168.0.236:3001`).

---

### Opción 2: Despliegue con Docker y Docker Compose (Recomendado para Producción)

El repositorio incluye un contenedor optimizado multi-etapa sobre `node:22-alpine` para un consumo mínimo de memoria (< 50 MB de RAM).

```bash
# 1. Ingresar al directorio
cd TP5/backend

# 2. Construir e iniciar el contenedor en segundo plano
docker-compose up -d --build

# 3. Verificar que el contenedor esté corriendo
docker ps
```

Para detener el servicio:
```bash
docker-compose down
```

---

### Opción 3: Despliegue en la Nube (PaaS / VPS Gratuito)

El microservicio es completamente autocontenido (Stateless) y puede desplegarse en cualquier servicio de hosting en la nube en menos de 2 minutos:

#### Despliegue en Render (Gratuito)
1. Crear una cuenta en [Render.com](https://render.com).
2. Crear un nuevo **Web Service** conectado al repositorio de GitHub.
3. Configuración:
   * **Root Directory**: `TP5/backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
4. Render asignará una URL pública HTTPS (ej: `https://qos-backend.onrender.com`).
5. En la app móvil (pestaña **Ajustes**), ingresar esa URL en **Backend de Referencia**.

#### Despliegue en Railway o Fly.io
El repositorio incluye el `Dockerfile` en la raíz de `TP5/backend`. Simplemente seleccionar "Deploy from Dockerfile" y exponer el puerto `3001`.

---

## 🧪 Verificación de Funcionamiento

Para corroborar que el servicio responde adecuadamente:

```bash
# 1. Healthcheck
curl http://localhost:3001/health

# 2. Ping
curl http://localhost:3001/api/ping

# 3. Descarga de 2 MB
curl -o /dev/null http://localhost:3001/api/download?sizeMb=2
```
Respuesta esperada de `/health`:
```json
{
  "status": "ok",
  "service": "Network QoS Monitor Reference Backend",
  "timestamp": 1728073500000,
  "uptimeSeconds": 45
}
```
