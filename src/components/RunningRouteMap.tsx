/// <reference types="@types/google.maps" />
import React, { useEffect, useState, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Polyline,
  ColorScheme,
  useMap,
} from '@vis.gl/react-google-maps';
import { GPXActivity } from '../types/running';
import { Maximize2, Minimize2, Navigation, Layers, Compass } from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyDWGUUfz_c7zu99uC12AJKg0X_9uMqjwGI';

interface RunningRouteMapProps {
  activity: GPXActivity;
  hoveredPointIndex: number | null;
  onPointHover?: (index: number | null) => void;
}

type MapThemeType = 'dark' | 'satellite' | 'streets';

// Helper component to control map camera and bounds fitting
const MapController: React.FC<{
  bounds: GPXActivity['bounds'];
  triggerRecenter: number;
}> = ({ bounds, triggerRecenter }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const gBounds = new google.maps.LatLngBounds(
      { lat: bounds.minLat, lng: bounds.minLon },
      { lat: bounds.maxLat, lng: bounds.maxLon }
    );
    map.fitBounds(gBounds, { top: 45, bottom: 45, left: 45, right: 45 });
  }, [map, bounds, triggerRecenter]);

  return null;
};

export const RunningRouteMap: React.FC<RunningRouteMapProps> = ({
  activity,
  hoveredPointIndex,
}) => {
  const [mapTheme, setMapTheme] = useState<MapThemeType>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recenterCount, setRecenterCount] = useState(0);

  const { points, bounds, splits } = activity;

  // Convert points to LatLngLiteral array for Google Maps
  const pathCoordinates = useMemo(() => {
    return points.map((p) => ({ lat: p.lat, lng: p.lon }));
  }, [points]);

  const defaultCenter = useMemo(() => {
    if (points.length === 0) return { lat: -23.5505, lng: -46.6333 };
    return {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lng: (bounds.minLon + bounds.maxLon) / 2,
    };
  }, [points, bounds]);

  const startPt = points[0];
  const endPt = points[points.length - 1];

  const handleRecenter = () => {
    setRecenterCount((prev) => prev + 1);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      setRecenterCount((prev) => prev + 1);
    }, 150);
  };

  if (points.length === 0) {
    return (
      <div className="w-full h-48 rounded-3xl bg-[#070d1e] border border-[#17284f] flex items-center justify-center text-slate-400">
        Nenhum ponto de rota encontrado no arquivo GPX.
      </div>
    );
  }

  // Determine Google Maps options based on selected theme
  const mapTypeId = mapTheme === 'satellite' ? 'hybrid' : 'roadmap';
  const colorScheme = mapTheme === 'dark' ? ColorScheme.DARK : ColorScheme.LIGHT;

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-[#17284f] bg-[#070d1e] shadow-2xl transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none h-screen w-screen'
          : 'h-[360px] sm:h-[450px]'
      }`}
    >
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'geometry']}>
        <Map
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_git_agentskills_v1']}
          defaultCenter={defaultCenter}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI={true}
          mapTypeId={mapTypeId}
          colorScheme={colorScheme}
          className="w-full h-full"
        >
          <MapController bounds={bounds} triggerRecenter={recenterCount} />

          {/* Outer glow polyline (Athletic gold/amber) */}
          <Polyline
            path={pathCoordinates}
            strokeColor="#f59e0b"
            strokeOpacity={0.4}
            strokeWeight={7}
          />

          {/* Core high-contrast polyline */}
          <Polyline
            path={pathCoordinates}
            strokeColor="#fbbf24"
            strokeOpacity={0.95}
            strokeWeight={4.5}
          />

          {/* Start Marker */}
          {startPt && (
            <AdvancedMarker
              position={{ lat: startPt.lat, lng: startPt.lon }}
              title="Largada"
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 border-2 border-white shadow-lg text-white font-black text-[10px] tracking-wide uppercase select-none transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Largada
              </div>
            </AdvancedMarker>
          )}

          {/* Finish Marker */}
          {endPt && (
            <AdvancedMarker
              position={{ lat: endPt.lat, lng: endPt.lon }}
              title="Chegada"
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 border-2 border-white shadow-lg text-slate-950 font-black text-[10px] tracking-wide uppercase select-none transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform">
                <span>🏁</span>
                <span>{activity.totalDistanceKm} km</span>
              </div>
            </AdvancedMarker>
          )}

          {/* Kilometer Markers along route */}
          {splits.map((split) => {
            if (split.km < splits.length || split.distanceM > 800) {
              const targetDistM = split.km * 1000;
              const pt = points.find((p) => p.distanceFromStartM >= targetDistM);
              if (pt) {
                return (
                  <AdvancedMarker
                    key={`split-km-${split.km}`}
                    position={{ lat: pt.lat, lng: pt.lon }}
                    title={`KM ${split.km} - Ritmo: ${split.paceFormatted}`}
                  >
                    <div className="bg-[#091329] text-amber-400 border border-amber-500/80 rounded-md px-1.5 py-0.5 text-[9px] font-black shadow-md select-none transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform">
                      {split.km}k
                    </div>
                  </AdvancedMarker>
                );
              }
            }
            return null;
          })}

          {/* Interactive Scrubber Marker (synced with elevation chart hover) */}
          {hoveredPointIndex !== null && points[hoveredPointIndex] && (
            <AdvancedMarker
              position={{
                lat: points[hoveredPointIndex].lat,
                lng: points[hoveredPointIndex].lon,
              }}
              zIndex={9999}
            >
              <div className="w-5 h-5 rounded-full bg-sky-400 border-3 border-white shadow-[0_0_16px_rgba(56,189,248,1)] transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      {/* Floating Map Controls Bar with Google Maps */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-[#050a18]/92 backdrop-blur-md p-1 rounded-xl border border-[#1a2d56] shadow-xl">
        {/* Dark Mode */}
        <button
          type="button"
          onClick={() => setMapTheme('dark')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mapTheme === 'dark'
              ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-[#122247]'
          }`}
          title="Google Maps: Tema Escuro"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Noturno</span>
        </button>

        {/* Satellite Mode (Google Maps Real Satellite) */}
        <button
          type="button"
          onClick={() => setMapTheme('satellite')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mapTheme === 'satellite'
              ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-[#122247]'
          }`}
          title="Google Maps: Satélite Real de Alta Resolução"
        >
          <span className="text-xs">🛰️</span>
          <span>Satélite</span>
        </button>

        {/* Streets Mode (Google Maps Streets) */}
        <button
          type="button"
          onClick={() => setMapTheme('streets')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mapTheme === 'streets'
              ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-[#122247]'
          }`}
          title="Google Maps: Cartografia de Ruas"
        >
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Ruas</span>
        </button>

        <div className="h-4 w-[1px] bg-[#1a2d56] mx-0.5" />

        {/* Recenter */}
        <button
          type="button"
          onClick={handleRecenter}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#122247] transition-all cursor-pointer"
          title="Recentralizar Rota"
        >
          <Navigation className="w-4 h-4 text-amber-400" />
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#122247] transition-all cursor-pointer"
          title={isFullscreen ? 'Fechar Tela Cheia' : 'Tela Cheia'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-amber-400" />
          ) : (
            <Maximize2 className="w-4 h-4 text-amber-400" />
          )}
        </button>
      </div>

      {/* Live hover badge over map (Synchronized with elevation chart scrub) */}
      {hoveredPointIndex !== null && activity.points[hoveredPointIndex] && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-20 bg-[#091329]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center gap-4 text-xs pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
            <span className="font-bold text-white">
              {(activity.points[hoveredPointIndex].distanceFromStartM / 1000).toFixed(2)} km
            </span>
          </div>

          <div className="text-slate-300">
            <span className="text-slate-500 mr-1">Altimetria:</span>
            <span className="font-bold text-amber-300">
              {activity.points[hoveredPointIndex].ele.toFixed(0)}m
            </span>
          </div>

          {activity.points[hoveredPointIndex].paceSecondsPerKm > 0 && (
            <div className="text-slate-300">
              <span className="text-slate-500 mr-1">Ritmo:</span>
              <span className="font-bold text-emerald-300">
                {Math.floor(activity.points[hoveredPointIndex].paceSecondsPerKm / 60)}:
                {Math.floor(activity.points[hoveredPointIndex].paceSecondsPerKm % 60)
                  .toString()
                  .padStart(2, '0')}{' '}
                /km
              </span>
            </div>
          )}

          {activity.points[hoveredPointIndex].heartRate && (
            <div className="text-slate-300">
              <span className="text-slate-500 mr-1">FC:</span>
              <span className="font-bold text-rose-400">
                {activity.points[hoveredPointIndex].heartRate} bpm
              </span>
            </div>
          )}

          {activity.points[hoveredPointIndex].gradePercent !== undefined && (
            <div className="text-slate-300">
              <span className="text-slate-500 mr-1">Inclinação:</span>
              <span
                className={`font-bold ${
                  activity.points[hoveredPointIndex].gradePercent! > 0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {activity.points[hoveredPointIndex].gradePercent! > 0 ? '+' : ''}
                {activity.points[hoveredPointIndex].gradePercent}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
