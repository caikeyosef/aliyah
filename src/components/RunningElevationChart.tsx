import React, { useRef, useState, useMemo } from 'react';
import { GPXActivity } from '../types/running';
import { Mountain, Zap, Heart, Footprints } from 'lucide-react';
import { formatPace } from '../utils/gpxParser';

interface RunningElevationChartProps {
  activity: GPXActivity;
  hoveredPointIndex: number | null;
  onHoverPoint: (index: number | null) => void;
}

export const RunningElevationChart: React.FC<RunningElevationChartProps> = ({
  activity,
  hoveredPointIndex,
  onHoverPoint,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeLayers, setActiveLayers] = useState<{
    elevation: boolean;
    pace: boolean;
    hr: boolean;
    cadence: boolean;
  }>({
    elevation: true,
    pace: true,
    hr: activity.hasHeartRate,
    cadence: false,
  });

  const { points, totalDistanceM, minElevationM, maxElevationM } = activity;

  // Chart dimensions in viewBox coordinates
  const width = 1000;
  const height = 260;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 30;
  const padBottom = 40;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Elevation range (with breathing room)
  const eleSpan = Math.max(20, maxElevationM - minElevationM);
  const eleMin = Math.floor(minElevationM - eleSpan * 0.1);
  const eleMax = Math.ceil(maxElevationM + eleSpan * 0.15);
  const eleRange = eleMax - eleMin || 1;

  // Pace range (in seconds/km, e.g. 210s = 3:30/km to 480s = 8:00/km)
  const paceMin = 180; // 3:00 /km (top of chart)
  const paceMax = 540; // 9:00 /km (bottom of chart)
  const paceRange = paceMax - paceMin;

  // HR range (100 to 205 bpm)
  const hrMin = 100;
  const hrMax = 205;
  const hrRange = hrMax - hrMin;

  // Cadence range (130 to 200 spm)
  const cadMin = 130;
  const cadMax = 200;
  const cadRange = cadMax - cadMin;

  // Sample points down if more than 800 to maintain silky 60fps rendering
  const sampledPoints = useMemo(() => {
    if (points.length <= 600) return points;
    const step = Math.ceil(points.length / 600);
    const result = [];
    for (let i = 0; i < points.length; i += step) {
      result.push(points[i]);
    }
    // Always include last point
    if (result[result.length - 1] !== points[points.length - 1]) {
      result.push(points[points.length - 1]);
    }
    return result;
  }, [points]);

  // Generate SVG path for elevation area
  const { elevationAreaPath, elevationLinePath, paceLinePath, hrLinePath, cadLinePath } =
    useMemo(() => {
      if (sampledPoints.length === 0 || totalDistanceM === 0) {
        return {
          elevationAreaPath: '',
          elevationLinePath: '',
          paceLinePath: '',
          hrLinePath: '',
          cadLinePath: '',
        };
      }

      const getX = (distM: number) => padLeft + (distM / totalDistanceM) * chartW;
      const getEleY = (ele: number) => padTop + chartH - ((ele - eleMin) / eleRange) * chartH;
      const getPaceY = (paceSec: number) => {
        const clamped = Math.max(paceMin, Math.min(paceMax, paceSec));
        // Faster pace (lower seconds) is higher up
        return padTop + ((clamped - paceMin) / paceRange) * chartH;
      };
      const getHrY = (hr: number) => padTop + chartH - ((hr - hrMin) / hrRange) * chartH;
      const getCadY = (cad: number) => padTop + chartH - ((cad - cadMin) / cadRange) * chartH;

      let eleLine = '';
      let paceLine = '';
      let hrLine = '';
      let cadLine = '';

      sampledPoints.forEach((p, idx) => {
        const x = getX(p.distanceFromStartM);
        const yEle = getEleY(p.ele);

        if (idx === 0) {
          eleLine += `M ${x.toFixed(1)} ${yEle.toFixed(1)}`;
        } else {
          eleLine += ` L ${x.toFixed(1)} ${yEle.toFixed(1)}`;
        }

        // Pace
        if (p.paceSecondsPerKm > 100 && p.paceSecondsPerKm < 600) {
          const yPace = getPaceY(p.paceSecondsPerKm);
          if (!paceLine) paceLine = `M ${x.toFixed(1)} ${yPace.toFixed(1)}`;
          else paceLine += ` L ${x.toFixed(1)} ${yPace.toFixed(1)}`;
        }

        // HR
        if (p.heartRate) {
          const yHr = getHrY(p.heartRate);
          if (!hrLine) hrLine = `M ${x.toFixed(1)} ${yHr.toFixed(1)}`;
          else hrLine += ` L ${x.toFixed(1)} ${yHr.toFixed(1)}`;
        }

        // Cadence
        if (p.cadence) {
          const yCad = getCadY(p.cadence);
          if (!cadLine) cadLine = `M ${x.toFixed(1)} ${yCad.toFixed(1)}`;
          else cadLine += ` L ${x.toFixed(1)} ${yCad.toFixed(1)}`;
        }
      });

      const firstX = getX(sampledPoints[0].distanceFromStartM);
      const lastX = getX(sampledPoints[sampledPoints.length - 1].distanceFromStartM);
      const bottomY = padTop + chartH;
      const eleArea = `${eleLine} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;

      return {
        elevationAreaPath: eleArea,
        elevationLinePath: eleLine,
        paceLinePath: paceLine,
        hrLinePath: hrLine,
        cadLinePath: cadLine,
      };
    }, [sampledPoints, totalDistanceM, eleMin, eleRange, chartW, chartH]);

  // Handle scrubber interaction
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentX = (clickX - (padLeft / width) * rect.width) / ((chartW / width) * rect.width);
    const clampedPercent = Math.max(0, Math.min(1, percentX));
    const targetDistM = clampedPercent * totalDistanceM;

    // Binary search closest point
    let low = 0;
    let high = points.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (points[mid].distanceFromStartM < targetDistM) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    onHoverPoint(low);
  };

  const activePoint =
    hoveredPointIndex !== null && hoveredPointIndex >= 0 && hoveredPointIndex < points.length
      ? points[hoveredPointIndex]
      : null;

  const activeX = activePoint
    ? padLeft + (activePoint.distanceFromStartM / totalDistanceM) * chartW
    : null;

  // X-axis distance markers (every 1km or 2km or 5km depending on total)
  const stepKm = activity.totalDistanceKm > 15 ? 5 : activity.totalDistanceKm > 7 ? 2 : 1;
  const xTicks: number[] = [];
  for (let k = stepKm; k < activity.totalDistanceKm; k += stepKm) {
    xTicks.push(k);
  }

  return (
    <div
      ref={containerRef}
      className="bg-[#091329] border border-[#17284f] rounded-3xl p-4 sm:p-5 shadow-xl space-y-4 select-none"
    >
      {/* Header & Metric Layer Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#142344]">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Mountain className="w-4 h-4 text-amber-400" />
            Perfil de Altimetria & Dinâmica de Corrida
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Passe o mouse ou toque no gráfico para inspecionar métricas sincronizadas com o mapa.
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveLayers((prev) => ({ ...prev, elevation: !prev.elevation }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeLayers.elevation
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-[#060c19] text-slate-500 border border-transparent hover:text-slate-300'
            }`}
          >
            <Mountain className="w-3.5 h-3.5 text-amber-400" />
            <span>Altimetria</span>
          </button>

          <button
            onClick={() => setActiveLayers((prev) => ({ ...prev, pace: !prev.pace }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeLayers.pace
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-[#060c19] text-slate-500 border border-transparent hover:text-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ritmo</span>
          </button>

          {activity.hasHeartRate && (
            <button
              onClick={() => setActiveLayers((prev) => ({ ...prev, hr: !prev.hr }))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeLayers.hr
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-[#060c19] text-slate-500 border border-transparent hover:text-slate-300'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Frequência</span>
            </button>
          )}

          {activity.hasCadence && (
            <button
              onClick={() => setActiveLayers((prev) => ({ ...prev, cadence: !prev.cadence }))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeLayers.cadence
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-[#060c19] text-slate-500 border border-transparent hover:text-slate-300'
              }`}
            >
              <Footprints className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cadência</span>
            </button>
          )}
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair overflow-visible"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => onHoverPoint(null)}
        >
          <defs>
            {/* Elevation Gradient */}
            <linearGradient id="eleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#d97706" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.02" />
            </linearGradient>

            {/* Glowing filter for lines */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines (horizontal) */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={width - padRight}
            y2={padTop}
            stroke="#16274e"
            strokeDasharray="4 4"
          />
          <line
            x1={padLeft}
            y1={padTop + chartH / 2}
            x2={width - padRight}
            y2={padTop + chartH / 2}
            stroke="#16274e"
            strokeDasharray="4 4"
          />
          <line
            x1={padLeft}
            y1={padTop + chartH}
            x2={width - padRight}
            y2={padTop + chartH}
            stroke="#1c305c"
          />

          {/* Elevation Area & Line */}
          {activeLayers.elevation && elevationAreaPath && (
            <>
              <path d={elevationAreaPath} fill="url(#eleGradient)" />
              <path
                d={elevationLinePath}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                filter="url(#glow)"
              />
            </>
          )}

          {/* Pace Curve */}
          {activeLayers.pace && paceLinePath && (
            <path
              d={paceLinePath}
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
              strokeDasharray="6 2"
              opacity="0.9"
            />
          )}

          {/* Heart Rate Line */}
          {activeLayers.hr && hrLinePath && (
            <path
              d={hrLinePath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
              opacity="0.85"
            />
          )}

          {/* Cadence Line */}
          {activeLayers.cadence && cadLinePath && (
            <path
              d={cadLinePath}
              fill="none"
              stroke="#818cf8"
              strokeWidth="1.8"
              opacity="0.85"
            />
          )}

          {/* Vertical distance grid lines & labels */}
          {xTicks.map((km) => {
            const x = padLeft + ((km * 1000) / totalDistanceM) * chartW;
            return (
              <g key={km}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + chartH}
                  stroke="#142347"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={padTop + chartH + 18}
                  fill="#64748b"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {km} km
                </text>
              </g>
            );
          })}

          {/* Left Y-axis labels (Elevation) */}
          <text
            x={padLeft - 8}
            y={padTop + 4}
            fill="#fbbf24"
            fontSize="10"
            fontWeight="bold"
            textAnchor="end"
          >
            {eleMax}m
          </text>
          <text
            x={padLeft - 8}
            y={padTop + chartH / 2 + 4}
            fill="#d97706"
            fontSize="10"
            fontWeight="bold"
            textAnchor="end"
          >
            {Math.round((eleMin + eleMax) / 2)}m
          </text>
          <text
            x={padLeft - 8}
            y={padTop + chartH}
            fill="#92400e"
            fontSize="10"
            fontWeight="bold"
            textAnchor="end"
          >
            {eleMin}m
          </text>

          {/* Right Y-axis labels (Pace) */}
          <text
            x={width - padRight + 8}
            y={padTop + 4}
            fill="#34d399"
            fontSize="10"
            fontWeight="bold"
            textAnchor="start"
          >
            3:00
          </text>
          <text
            x={width - padRight + 8}
            y={padTop + chartH / 2 + 4}
            fill="#10b981"
            fontSize="10"
            fontWeight="bold"
            textAnchor="start"
          >
            6:00
          </text>
          <text
            x={width - padRight + 8}
            y={padTop + chartH}
            fill="#059669"
            fontSize="10"
            fontWeight="bold"
            textAnchor="start"
          >
            9:00
          </text>

          {/* Interactive Scrubber Cursor Line & Dot */}
          {activeX !== null && activePoint && (
            <g>
              <line
                x1={activeX}
                y1={padTop - 8}
                x2={activeX}
                y2={padTop + chartH + 4}
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="2 2"
              />
              <circle
                cx={activeX}
                cy={padTop + chartH - ((activePoint.ele - eleMin) / eleRange) * chartH}
                r="5"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip positioned near cursor */}
        {activePoint && activeX !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-[#050a18]/95 backdrop-blur-md border border-sky-400/50 rounded-xl p-2.5 shadow-2xl text-[11px] leading-tight space-y-1 z-30 transition-all"
            style={{
              left: `${Math.min(80, Math.max(10, (activeX / width) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold text-white border-b border-[#1a2d56] pb-1 flex items-center justify-between gap-3">
              <span className="text-sky-300">
                {(activePoint.distanceFromStartM / 1000).toFixed(2)} km
              </span>
              <span className="text-slate-400 font-normal">
                {activePoint.time ? new Date(activePoint.time).toLocaleTimeString('pt-BR') : ''}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-slate-300">
              <span className="text-amber-400 font-medium">Altimetria:</span>
              <span className="font-bold text-white">{activePoint.ele.toFixed(1)} m</span>
            </div>

            {activePoint.paceSecondsPerKm > 0 && (
              <div className="flex items-center justify-between gap-3 text-slate-300">
                <span className="text-emerald-400 font-medium">Ritmo:</span>
                <span className="font-bold text-white">
                  {formatPace(activePoint.paceSecondsPerKm)}
                </span>
              </div>
            )}

            {activePoint.heartRate && (
              <div className="flex items-center justify-between gap-3 text-slate-300">
                <span className="text-rose-400 font-medium">Freq. Cardíaca:</span>
                <span className="font-bold text-white">{activePoint.heartRate} bpm</span>
              </div>
            )}

            {activePoint.cadence && (
              <div className="flex items-center justify-between gap-3 text-slate-300">
                <span className="text-indigo-400 font-medium">Cadência:</span>
                <span className="font-bold text-white">{activePoint.cadence} spm</span>
              </div>
            )}

            {activePoint.gradePercent !== undefined && (
              <div className="flex items-center justify-between gap-3 text-slate-300">
                <span className="text-slate-400 font-medium">Inclinação:</span>
                <span
                  className={`font-bold ${
                    activePoint.gradePercent > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {activePoint.gradePercent > 0 ? '+' : ''}
                  {activePoint.gradePercent}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500/80"></span>
          <span>Altimetria (m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-400"></span>
          <span>Ritmo Instantâneo (min/km)</span>
        </div>
        {activity.hasHeartRate && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500"></span>
            <span>Freq. Cardíaca (bpm)</span>
          </div>
        )}
        {activity.hasCadence && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-400"></span>
            <span>Cadência (spm)</span>
          </div>
        )}
      </div>
    </div>
  );
};
