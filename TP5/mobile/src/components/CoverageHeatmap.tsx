import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Rect, Text as SvgText, G } from 'react-native-svg';
import { MeasurementSession } from '../types';
import { colors, spacing, borderRadius } from '../constants/theme';
import { QoSScorer } from '../engine/QoSScorer';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type MapTileStyle = 'osm' | 'satellite' | 'vector';

interface Props {
  sessions: MeasurementSession[];
  currentLatitude?: number;
  currentLongitude?: number;
  height?: number;
}

export const CoverageHeatmap: React.FC<Props> = ({
  sessions,
  currentLatitude = -32.48761,
  currentLongitude = -58.22996,
  height = 420,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const mapWidth = Math.max(320, screenWidth - 32);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [mapTileStyle, setMapTileStyle] = useState<MapTileStyle>('osm');
  const [selectedSession, setSelectedSession] = useState<MeasurementSession | null>(null);

  // Escuchar selecciones de marcadores enviadas desde el iframe de Leaflet (Web)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleMsg = (e: any) => {
      if (e?.data && e.data.type === 'SELECT_QOS_SESSION') {
        const found = sessions.find((s) => s.id === e.data.id);
        if (found) setSelectedSession(found);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [sessions]);

  // Generador dinámico de mapa interactivo Leaflet (OpenStreetMap / CartoDB / Satellite)
  const leafletHtml = useMemo(() => {
    const pinsData = JSON.stringify(
      sessions.map((s) => ({
        id: s.id,
        lat: s.location.latitude,
        lng: s.location.longitude,
        operator: s.signal.operator,
        netType: s.signal.networkType,
        dbm: s.signal.dbm,
        qos: s.overallQoSRating,
        color: QoSScorer.getQoSColor(s.overallQoSRating),
        rtt: s.pings[0]?.avgRttMs ?? 0,
        jitter: s.pings[0]?.jitterMs ?? 0,
        dl: s.throughput.downloadMbps,
        ul: s.throughput.uploadMbps,
        address: s.location.addressSummary || `${s.location.latitude.toFixed(4)}, ${s.location.longitude.toFixed(4)}`,
        date: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }))
    );

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .custom-popup .leaflet-popup-content-wrapper {
      background: #ffffff;
      color: #0f172a;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .custom-popup .leaflet-popup-tip {
      background: #ffffff;
    }
    .custom-popup .leaflet-popup-content {
      margin: 12px 14px;
      line-height: 1.4;
    }
    .popup-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .popup-title {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .popup-sub {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .popup-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      background: #f8fafc;
      padding: 8px;
      border-radius: 8px;
      margin-bottom: 8px;
      border: 1px solid #e2e8f0;
    }
    .popup-stat-lbl {
      font-size: 9px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
    }
    .popup-stat-val {
      font-size: 12px;
      font-weight: 800;
      color: #0284c7;
    }
    .user-pulse {
      width: 18px;
      height: 18px;
      background: #0284c7;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 0 10px rgba(2, 132, 199, 0.7);
      animation: userPulse 2s infinite;
    }
    @keyframes userPulse {
      0% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.7); }
      70% { box-shadow: 0 0 0 15px rgba(2, 132, 199, 0); }
      100% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const sessions = ${pinsData};
    const userLat = ${currentLatitude};
    const userLng = ${currentLongitude};
    const tileMode = '${mapTileStyle}';
    const showHeat = ${showHeatmap};

    // Centro inicial: Calle Artigas 233 / Plaza Ramirez, Concepcion del Uruguay
    const centerLat = userLat;
    const centerLng = userLng;

    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([centerLat, centerLng], 15);

    // Seleccion de capa cartografica
    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let subdomains = 'abc';
    if (tileMode === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      subdomains = 'abcd';
    }

    L.tileLayer(tileUrl, { maxZoom: 19, subdomains }).addTo(map);

    // 1. Capa de Calor KDE (Heatmap) sobre las calles de la ciudad
    if (showHeat) {
      sessions.forEach(s => {
        L.circle([s.lat, s.lng], {
          radius: 280,
          color: s.color,
          fillColor: s.color,
          fillOpacity: 0.22,
          weight: 1,
          opacity: 0.4
        }).addTo(map);

        L.circle([s.lat, s.lng], {
          radius: 140,
          color: s.color,
          fillColor: s.color,
          fillOpacity: 0.35,
          weight: 0
        }).addTo(map);
      });
    }

    // 2. Marcadores interactivos de estación sobre coordenadas reales
    const bounds = [];
    sessions.forEach(s => {
      bounds.push([s.lat, s.lng]);
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: 9,
        fillColor: s.color,
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 0.95
      }).addTo(map);

      const popupHtml = \`
        <div>
          <div class="popup-badge" style="background: \${s.color}25; color: \${s.color}; border: 1px solid \${s.color}60;">
            \${s.qos} • \${s.netType}
          </div>
          <div class="popup-title">\${s.operator} (\${s.dbm} dBm)</div>
          <div class="popup-sub">📍 \${s.address}</div>
          <div class="popup-grid">
            <div>
              <div class="popup-stat-lbl">Latencia / Jitter</div>
              <div class="popup-stat-val">\${s.rtt} ms <span style="font-size:10px;color:#94a3b8">(\${s.jitter}ms)</span></div>
            </div>
            <div>
              <div class="popup-stat-lbl">Velocidad</div>
              <div class="popup-stat-val">↓\${s.dl} ↑\${s.ul} <span style="font-size:10px;color:#94a3b8">Mbps</span></div>
            </div>
          </div>
          <div style="font-size: 10px; color: #64748b; text-align: right;">\${s.date}</div>
        </div>
      \`;

      marker.bindPopup(popupHtml, { className: 'custom-popup' });
      marker.on('click', () => {
        window.parent.postMessage({ type: 'SELECT_QOS_SESSION', id: s.id }, '*');
      });
    });

    // 3. Marcador de Posición Actual del Usuario (Calle Artigas 233)
    bounds.push([userLat, userLng]);
    const userIcon = L.divIcon({
      className: 'user-icon-container',
      html: '<div class="user-pulse"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    const userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
    userMarker.bindPopup(\`
      <div style="padding: 4px;">
        <div style="font-weight: 800; font-size: 13px; color: #0284c7;">📍 Tu Posición Actual</div>
        <div style="font-size: 12px; color: #0f172a; font-weight: 700; margin-top: 2px;">Calle Artigas 233</div>
        <div style="font-size: 11px; color: #64748b;">Concepción del Uruguay</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 3px;">\${userLat.toFixed(5)}, \${userLng.toFixed(5)}</div>
      </div>
    \`, { className: 'custom-popup' });

    // Ajustar vista geográfica a todas las mediciones de Concepción del Uruguay
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
    }
  </script>
</body>
</html>
    `;
  }, [sessions, currentLatitude, currentLongitude, mapTileStyle, showHeatmap]);

  // Bounding Box para modo vectorial SVG
  const lats = sessions.map((s) => s.location.latitude).concat(currentLatitude);
  const lngs = sessions.map((s) => s.location.longitude).concat(currentLongitude);

  const minLat = Math.min(...lats) - 0.008;
  const maxLat = Math.max(...lats) + 0.008;
  const minLng = Math.min(...lngs) - 0.008;
  const maxLng = Math.max(...lngs) + 0.008;

  const projectCoords = (lat: number, lng: number) => {
    const latSpan = maxLat - minLat || 0.01;
    const lngSpan = maxLng - minLng || 0.01;
    const normX = (lng - minLng) / lngSpan;
    const normY = 1 - (lat - minLat) / latSpan;
    const padding = 24;
    const x = padding + normX * (mapWidth - padding * 2);
    const y = padding + normY * (height - padding * 2);
    return { x, y };
  };

  const userPos = projectCoords(currentLatitude, currentLongitude);

  return (
    <View style={styles.container}>
      {/* Barra de herramientas superior */}
      <View style={styles.toolbar}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="radar" size={18} color={colors.secondary} />
          <Text style={styles.mapTitle}>Mapa de Cobertura</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{sessions.length} puntos</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.toolBtn, showHeatmap && styles.toolBtnActive]}
            onPress={() => setShowHeatmap(!showHeatmap)}
          >
            <MaterialCommunityIcons
              name={showHeatmap ? 'layers' : 'layers-off'}
              size={16}
              color={showHeatmap ? colors.white : colors.textSecondary}
            />
            <Text style={[styles.toolBtnText, showHeatmap && styles.toolBtnTextActive]}>
              Heatmap
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Selector de Capa Cartográfica Real */}
      <View style={styles.tileBar}>
        <Pressable
          style={[styles.tileBtn, mapTileStyle === 'osm' && styles.tileBtnActive]}
          onPress={() => setMapTileStyle('osm')}
        >
          <MaterialCommunityIcons
            name="map-outline"
            size={14}
            color={mapTileStyle === 'osm' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tileBtnText, mapTileStyle === 'osm' && styles.tileBtnTextActive]}>
            Calles (OSM)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tileBtn, mapTileStyle === 'satellite' && styles.tileBtnActive]}
          onPress={() => setMapTileStyle('satellite')}
        >
          <MaterialCommunityIcons
            name="satellite-variant"
            size={14}
            color={mapTileStyle === 'satellite' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tileBtnText, mapTileStyle === 'satellite' && styles.tileBtnTextActive]}>
            Satelital
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tileBtn, mapTileStyle === 'vector' && styles.tileBtnActive]}
          onPress={() => setMapTileStyle('vector')}
        >
          <MaterialCommunityIcons
            name="vector-polygon"
            size={14}
            color={mapTileStyle === 'vector' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tileBtnText, mapTileStyle === 'vector' && styles.tileBtnTextActive]}>
            Vectorial
          </Text>
        </Pressable>
      </View>

      {/* Lienzo del Mapa: OpenStreetMap Leaflet en Web o SVG Vectorial */}
      <View style={[styles.canvasWrapper, { width: mapWidth, height }]}>
        {Platform.OS === 'web' && mapTileStyle !== 'vector' ? (
          <iframe
            title="Coverage Map Leaflet"
            srcDoc={leafletHtml}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: borderRadius.lg,
            } as any}
          />
        ) : (
          <Svg width={mapWidth} height={height}>
            <Defs>
              <RadialGradient id="heatExcellent" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={colors.qosExcellent} stopOpacity="0.8" />
                <Stop offset="40%" stopColor={colors.qosExcellent} stopOpacity="0.4" />
                <Stop offset="80%" stopColor={colors.secondary} stopOpacity="0.15" />
                <Stop offset="100%" stopColor={colors.transparent} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="heatGood" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={colors.qosGood} stopOpacity="0.75" />
                <Stop offset="50%" stopColor={colors.qosGood} stopOpacity="0.35" />
                <Stop offset="100%" stopColor={colors.transparent} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="heatFair" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={colors.qosFair} stopOpacity="0.75" />
                <Stop offset="50%" stopColor={colors.qosFair} stopOpacity="0.35" />
                <Stop offset="100%" stopColor={colors.transparent} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="heatPoor" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={colors.qosPoor} stopOpacity="0.85" />
                <Stop offset="50%" stopColor={colors.qosPoor} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={colors.transparent} stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Fondo estilo mapa claro */}
            <Rect width={mapWidth} height={height} fill={colors.surfaceLight} rx={16} />

            {/* Retícula de cuadrícula geográfica */}
            {[0.25, 0.5, 0.75].map((factor) => (
              <React.Fragment key={factor}>
                <Rect
                  x={0}
                  y={height * factor}
                  width={mapWidth}
                  height={1}
                  fill={colors.border}
                  opacity={0.6}
                />
                <Rect
                  x={mapWidth * factor}
                  y={0}
                  width={1}
                  height={height}
                  fill={colors.border}
                  opacity={0.6}
                />
              </React.Fragment>
            ))}

            {/* 1. Capa de Calor (Heatmap Overlay RF-05) */}
            {showHeatmap &&
              sessions.map((s) => {
                const { x, y } = projectCoords(s.location.latitude, s.location.longitude);
                const gradId =
                  s.overallQoSRating === 'EXCELLENT'
                    ? 'url(#heatExcellent)'
                    : s.overallQoSRating === 'GOOD'
                    ? 'url(#heatGood)'
                    : s.overallQoSRating === 'FAIR'
                    ? 'url(#heatFair)'
                    : 'url(#heatPoor)';

                return (
                  <Circle
                    key={`heat-${s.id}`}
                    cx={x}
                    cy={y}
                    r={38}
                    fill={gradId}
                  />
                );
              })}

            {/* 2. Marcadores visuales de estación */}
            {sessions.map((s) => {
              const { x, y } = projectCoords(s.location.latitude, s.location.longitude);
              const markerColor = QoSScorer.getQoSColor(s.overallQoSRating);

              return (
                <G key={`marker-graphics-${s.id}`}>
                  <Circle
                    cx={x}
                    cy={y}
                    r={10}
                    fill={colors.surface}
                    stroke={markerColor}
                    strokeWidth={2.5}
                  />
                  <Circle
                    cx={x}
                    cy={y}
                    r={5}
                    fill={markerColor}
                  />
                  <SvgText
                    x={x}
                    y={y - 14}
                    fill={colors.textSecondary}
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {s.signal.networkType}
                  </SvgText>
                </G>
              );
            })}

            {/* 3. Posición actual del usuario */}
            <Circle
              cx={userPos.x}
              cy={userPos.y}
              r={14}
              fill="none"
              stroke={colors.secondary}
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <Circle
              cx={userPos.x}
              cy={userPos.y}
              r={6}
              fill={colors.secondary}
            />
          </Svg>
        )}

        {/* Hotspots interactivos en modo vectorial */}
        {(mapTileStyle === 'vector' || Platform.OS !== 'web') &&
          sessions.map((s) => {
            const { x, y } = projectCoords(s.location.latitude, s.location.longitude);
            return (
              <Pressable
                key={`hotspot-${s.id}`}
                style={[
                  styles.pinHotspot,
                  {
                    left: x - 18,
                    top: y - 18,
                  },
                ]}
                onPress={() => setSelectedSession(s)}
              />
            );
          })}

        {/* Leyenda de Semáforo de Cobertura */}
        <View style={styles.legendOverlay}>
          <View style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: colors.qosExcellent }]} />
            <Text style={styles.legendLabel}>Excelente</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: colors.qosGood }]} />
            <Text style={styles.legendLabel}>Buena</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: colors.qosFair }]} />
            <Text style={styles.legendLabel}>Regular</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: colors.qosPoor }]} />
            <Text style={styles.legendLabel}>Pobre</Text>
          </View>
        </View>
      </View>

      {/* Modal interactivo de Detalle de Medición Georreferenciada */}
      {selectedSession && (
        <Modal
          visible={!!selectedSession}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedSession(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Detalle de Medición</Text>
                  <Text style={styles.modalSubtitle}>
                    {new Date(selectedSession.timestamp).toLocaleString()}
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedSession(null)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                {/* Zona / Ubicación */}
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="map-marker" size={18} color={colors.secondary} />
                  <Text style={styles.detailText} numberOfLines={2}>
                    {selectedSession.location.addressSummary ||
                      `${selectedSession.location.latitude.toFixed(4)}, ${selectedSession.location.longitude.toFixed(4)}`}
                  </Text>
                </View>

                {/* Red y Operador */}
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="antenna" size={18} color={colors.primary} />
                  <Text style={styles.detailText}>
                    {selectedSession.signal.operator} ({selectedSession.signal.networkType}) •{' '}
                    {selectedSession.signal.dbm} dBm
                  </Text>
                </View>

                {/* Métricas de Latencia y Velocidad */}
                <View style={styles.metricsBox}>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricHeader}>LATENCIA</Text>
                    <Text style={styles.metricValue}>
                      {selectedSession.pings[0]?.avgRttMs ?? 0} ms
                    </Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricHeader}>JITTER</Text>
                    <Text style={styles.metricValue}>
                      {selectedSession.pings[0]?.jitterMs ?? 0} ms
                    </Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricHeader}>DESCARGA</Text>
                    <Text style={[styles.metricValue, { color: colors.secondary }]}>
                      {selectedSession.throughput.downloadMbps} Mbps
                    </Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricHeader}>SUBIDA</Text>
                    <Text style={[styles.metricValue, { color: colors.accentPurple }]}>
                      {selectedSession.throughput.uploadMbps} Mbps
                    </Text>
                  </View>
                </View>

                {/* Estado QoS */}
                <View
                  style={[
                    styles.qosBadge,
                    { backgroundColor: QoSScorer.getQoSColor(selectedSession.overallQoSRating) + '25' },
                  ]}
                >
                  <Text
                    style={[
                      styles.qosBadgeText,
                      { color: QoSScorer.getQoSColor(selectedSession.overallQoSRating) },
                    ]}
                  >
                    Calidad: {QoSScorer.getQoSTitle(selectedSession.overallQoSRating)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  countText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  toolBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toolBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  toolBtnTextActive: {
    color: colors.white,
  },
  tileBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.sm,
  },
  tileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tileBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  tileBtnTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  canvasWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    alignSelf: 'center',
  },
  pinHotspot: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    zIndex: 10,
  },
  legendOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.4)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  colorBox: {
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  legendLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  metricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricHeader: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  qosBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  qosBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
