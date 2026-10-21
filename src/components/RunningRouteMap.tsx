import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { GPXActivity } from '../types/running';
import { Maximize2, Minimize2, Navigation, Compass } from 'lucide-react';

interface RunningRouteMapProps {
  activity: GPXActivity;
  hoveredPointIndex: number | null;
  onPointHover?: (index: number | null) => void;
}

export const RunningRouteMap: React.FC<RunningRouteMapProps> = ({
  activity,
  hoveredPointIndex,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const hoverMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const glowLineRef = useRef<L.Polyline | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove existing map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const { points, bounds } = activity;
    if (points.length === 0) return;

    // Create fresh Leaflet Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
    });
    mapInstanceRef.current = map;

    // Add Zoom Control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // High-performance, high-contrast dark tiles for sports routes
    const darkTileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
        pane: 'tilePane',
      }
    );
    darkTileLayer.addTo(map);
    darkTileLayer.bringToBack();

    // LatLng array
    const latLngs: L.LatLngExpression[] = points.map((p) => [p.lat, p.lon]);

    // Outer glow polyline (Strava Athletic Orange/Gold)
    const glowLine = L.polyline(latLngs, {
      color: '#f59e0b',
      weight: 7,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    glowLineRef.current = glowLine;

    // Core high-contrast polyline
    const polyline = L.polyline(latLngs, {
      color: '#fbbf24',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    polylineRef.current = polyline;

    // Start marker (Green circle)
    const startPt = points[0];
    const startIcon = L.divIcon({
      className: 'start-marker-icon',
      html: `
        <div style="
          width: 22px;
          height: 22px;
          background: #10b981;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    L.marker([startPt.lat, startPt.lon], { icon: startIcon })
      .addTo(map)
      .bindTooltip('<b>LARGADA</b><br/>0.00 km', { direction: 'top', className: 'strava-tooltip' });

    // Finish marker (Gold/Checkered Flag)
    const endPt = points[points.length - 1];
    const endIcon = L.divIcon({
      className: 'finish-marker-icon',
      html: `
        <div style="
          width: 26px;
          height: 26px;
          background: #f59e0b;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 16px rgba(245, 158, 11, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          cursor: pointer;
        ">
          🏁
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    L.marker([endPt.lat, endPt.lon], { icon: endIcon })
      .addTo(map)
      .bindTooltip(`<b>CHEGADA</b><br/>${activity.totalDistanceKm} km`, {
        direction: 'top',
        className: 'strava-tooltip',
      });

    // Kilometer markers along route (1 km, 2 km, ...)
    activity.splits.forEach((split) => {
      if (split.km < activity.splits.length || split.distanceM > 800) {
        const targetDistM = split.km * 1000;
        const pt = points.find((p) => p.distanceFromStartM >= targetDistM);
        if (pt) {
          const kmIcon = L.divIcon({
            className: 'km-split-icon',
            html: `
              <div style="
                background: #091329;
                color: #fbbf24;
                border: 1.5px solid #d97706;
                border-radius: 10px;
                padding: 1px 6px;
                font-size: 9px;
                font-weight: 800;
                box-shadow: 0 2px 8px rgba(0,0,0,0.8);
                white-space: nowrap;
                transform: translate(-50%, -50%);
              ">
                ${split.km}k
              </div>
            `,
            iconSize: [24, 16],
            iconAnchor: [12, 8],
          });
          L.marker([pt.lat, pt.lon], { icon: kmIcon })
            .addTo(map)
            .bindTooltip(`<b>KM ${split.km}</b> • Ritmo: ${split.paceFormatted}`, {
              direction: 'top',
              className: 'strava-tooltip',
            });
        }
      }
    });

    // Create interactive hover / scrubber marker
    const scrubIcon = L.divIcon({
      className: 'scrubber-marker-icon',
      html: `
        <div style="
          width: 18px;
          height: 18px;
          background: #38bdf8;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 16px rgba(56, 189, 248, 1);
        "></div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const hoverMarker = L.marker([startPt.lat, startPt.lon], {
      icon: scrubIcon,
      zIndexOffset: 1000,
    });
    hoverMarkerRef.current = hoverMarker;

    // Fit bounds with comfortable padding
    const corner1 = L.latLng(bounds.minLat, bounds.minLon);
    const corner2 = L.latLng(bounds.maxLat, bounds.maxLon);
    map.fitBounds(L.latLngBounds(corner1, corner2), { padding: [45, 45] });

    return () => {
      glowLine.remove();
      polyline.remove();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [activity]);

  // Sync hover point with scrubber marker
  useEffect(() => {
    if (!mapInstanceRef.current || !hoverMarkerRef.current) return;

    if (
      hoveredPointIndex !== null &&
      hoveredPointIndex >= 0 &&
      hoveredPointIndex < activity.points.length
    ) {
      const pt = activity.points[hoveredPointIndex];
      hoverMarkerRef.current.setLatLng([pt.lat, pt.lon]);
      if (!mapInstanceRef.current.hasLayer(hoverMarkerRef.current)) {
        hoverMarkerRef.current.addTo(mapInstanceRef.current);
      }
    } else {
      if (mapInstanceRef.current.hasLayer(hoverMarkerRef.current)) {
        hoverMarkerRef.current.remove();
      }
    }
  }, [hoveredPointIndex, activity]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const { bounds } = activity;
    const corner1 = L.latLng(bounds.minLat, bounds.minLon);
    const corner2 = L.latLng(bounds.maxLat, bounds.maxLon);
    mapInstanceRef.current.fitBounds(L.latLngBounds(corner1, corner2), {
      padding: [45, 45],
    });
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
      handleRecenter();
    }, 150);
  };

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-[#17284f] bg-[#070d1e] shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : 'h-[360px] sm:h-[450px]'
      }`}
    >
      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-10"
      />

      {/* Floating Map Controls Bar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-[#050a18]/92 backdrop-blur-md px-2 py-1.5 rounded-xl border border-[#1a2d56] shadow-xl">
        <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold text-amber-300">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Trajeto GPX</span>
        </div>

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
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
        </button>
      </div>

      {/* Live hover badge over map (Synchronized with elevation chart scrub) */}
      {hoveredPointIndex !== null && activity.points[hoveredPointIndex] && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-20 bg-[#091329]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center gap-4 text-xs pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></span>
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
