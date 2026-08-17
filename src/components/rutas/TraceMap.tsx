"use client";

import React, { useMemo } from 'react';
// @ts-ignore
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';
import { Truck } from 'lucide-react';

const geoUrl = '/venezuela.json';

const STATE_COORDS: Record<string, [number, number]> = {
  'distrito capital': [-66.9167, 10.5], 'miranda': [-66.5, 10.25], 'la guaira': [-66.9333, 10.6], 'vargas': [-66.9333, 10.6], 
  'carabobo': [-68.0, 10.1667], 'lara': [-69.3333, 10.0667], 'falcon': [-69.6667, 11.4167], 'yaracuy': [-68.7333, 10.3333], 
  'portuguesa': [-69.25, 9.1667], 'cojedes': [-68.3, 9.6333], 'aragua': [-67.6, 10.25], 'guarico': [-66.9167, 8.9167], 
  'apure': [-68.4167, 7.8833], 'zulia': [-71.6333, 10.6333], 'tachira': [-72.2333, 7.7667], 'merida': [-71.1333, 8.6], 
  'trujillo': [-70.4333, 9.3667], 'barinas': [-70.2, 8.6333], 'anzoategui': [-64.6167, 9.1667], 'monagas': [-63.1833, 9.75], 
  'sucre': [-63.1833, 10.45], 'nueva esparta': [-63.9167, 11.0333], 'delta amacuro': [-61.9167, 8.6333], 'bolivar': [-63.55, 7.1333], 
  'amazonas': [-65.5833, 3.1667]
};

const normalizeStateName = (name: string) => {
  if (!name) return '';
  const normalized = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace('estado ', '')
    .trim();
  if (normalized === 'capital' || normalized === 'distrito capital') return 'distrito capital';
  if (normalized === 'la guaira' || normalized === 'vargas') return 'la guaira';
  return normalized;
};

interface TraceMapProps {
  events: any[];
}

export default function TraceMap({ events }: TraceMapProps) {
  // Sort events by date to trace the route
  const sortedEvents = useMemo(() => {
    return [...events]
      .filter(e => e.state && STATE_COORDS[normalizeStateName(e.state)])
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [events]);

  const activeStates = useMemo(() => new Set(sortedEvents.map(e => normalizeStateName(e.state))), [sortedEvents]);

  const routeCoordinates = useMemo(() => {
    const coords: [number, number][] = [];
    const seen = new Set();
    sortedEvents.forEach(e => {
      const norm = normalizeStateName(e.state);
      if (!seen.has(norm)) {
        seen.add(norm);
        coords.push(STATE_COORDS[norm]);
      }
    });
    return coords;
  }, [sortedEvents]);

  const lastCoord = routeCoordinates.length > 0 ? routeCoordinates[routeCoordinates.length - 1] : null;

  return (
    <div className="w-full h-[400px] bg-transparent rounded-2xl overflow-hidden relative flex items-center justify-center">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 2500, center: [-66, 7.5] }}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo: any) => {
              const geoName = geo.properties.NAME_1 || geo.properties.name || geo.properties.hc_key;
              const normName = normalizeStateName(geoName);
              const isActive = activeStates.has(normName);
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: isActive ? '#00205B' : '#E2E8F0',
                      stroke: '#FFFFFF',
                      strokeWidth: 0.6,
                      outline: 'none',
                    },
                    hover: {
                      fill: isActive ? '#16356F' : '#CBD5E1',
                      stroke: '#FFFFFF',
                      strokeWidth: 1.2,
                      outline: 'none',
                    },
                    pressed: {
                      fill: '#FE5000',
                      outline: 'none',
                    }
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Trazado de ruta (Líneas) */}
        {routeCoordinates.length > 1 && (
          <Line
            from={routeCoordinates[0]}
            to={routeCoordinates[routeCoordinates.length - 1]}
            coordinates={routeCoordinates}
            stroke="#FE5000"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6, 6"
            className="animate-pulse"
          />
        )}

        {/* Marcadores de paradas */}
        {routeCoordinates.map((coord, idx) => (
          <Marker key={`marker-${idx}`} coordinates={coord}>
            <circle r={4} fill="#FE5000" stroke="#FFFFFF" strokeWidth={2} />
          </Marker>
        ))}

        {/* Indicador de posición actual (Último evento) */}
        {lastCoord && (
          <Marker coordinates={lastCoord}>
            <g transform="translate(-16, -24)">
              <rect x="0" y="0" width="32" height="24" rx="6" fill="#FE5000" className="drop-shadow-lg" />
              <text x="16" y="15" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="Arial" fontWeight="bold">
                🚚
              </text>
            </g>
          </Marker>
        )}
      </ComposableMap>
    </div>
  );
}
