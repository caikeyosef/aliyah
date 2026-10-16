import React, { useState } from 'react';
import {
  UserProfile,
  WeightLog,
} from '../types/fitness';
import {
  generateWeightProjection,
} from '../utils/fitnessMath';
import { getTodayDateStr } from '../utils/storage';
import {
  TrendingDown,
  TrendingUp,
  Target,
  Scale,
  Calendar,
  Plus,
  Trash2,
  Sparkles,
  Edit2,
  ShieldCheck,
} from 'lucide-react';

interface ProgressChartsTabProps {
  profile: UserProfile;
  weightLogs: WeightLog[];
  onAddWeight: (weight: number, date: string, notes?: string) => void;
  onDeleteWeight: (id: string) => void;
  onUpdateTargetDays: (days: number) => void;
  onOpenSetGoalModal: () => void;
}

export const ProgressChartsTab: React.FC<ProgressChartsTabProps> = ({
  profile,
  weightLogs,
  onAddWeight,
  onDeleteWeight,
  onUpdateTargetDays,
  onOpenSetGoalModal,
}) => {
  const [newWeight, setNewWeight] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(getTodayDateStr());
  const [newNotes, setNewNotes] = useState<string>('Pesagem em jejum');
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    date: string;
    weight: number;
    isProjected: boolean;
  } | null>(null);

  // Sorted logs from props
  const sortedLogs: WeightLog[] = [...weightLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Reference initial weight strictly from user's initial registration (step 1)
  const initialWeight = Number(profile.startWeight || profile.currentWeight || 75);
  const initialDateStr = profile.startDate || (sortedLogs[0]?.date ?? getTodayDateStr());

  const referenceLog: WeightLog = {
    id: 'wl-initial-ref',
    date: initialDateStr,
    weightKg: initialWeight,
    notes: 'Pesagem Inicial de Referência (Cadastro Inicial)',
  };

  // Ensure effectiveLogs always has the initial reference weigh-in from registration
  const hasRefLog = sortedLogs.some(
    (l) => l.id.startsWith('wl-initial-ref') || (l.date === initialDateStr && Math.abs(l.weightKg - initialWeight) < 0.05)
  );

  const effectiveLogs: WeightLog[] = hasRefLog
    ? sortedLogs
    : [referenceLog, ...sortedLogs.filter((l) => l.date !== initialDateStr)].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

  const latestWeight = effectiveLogs[effectiveLogs.length - 1]?.weightKg ?? profile.currentWeight;
  const weightChange = Number((latestWeight - initialWeight).toFixed(1));

  // Projection points across exact days
  const projectionPoints = generateWeightProjection(profile);

  // SVG Chart Setup
  const allWeights = [
    ...effectiveLogs.map((l) => l.weightKg),
    ...projectionPoints.map((p) => p.projectedWeight),
  ];
  const minWeight = Math.floor(Math.min(...allWeights) - 1.5);
  const maxWeight = Math.ceil(Math.max(...allWeights) + 1.5);
  const weightRange = Math.max(1, maxWeight - minWeight);

  const chartWidth = 720;
  const chartHeight = 320;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const totalDays = Math.max(1, profile.targetDays || 60);
  const startDateMs = new Date(profile.startDate || sortedLogs[0]?.date || new Date()).getTime();
  const totalDurationMs = totalDays * 86400000;

  const getY = (w: number) => {
    return padding.top + innerHeight - ((w - minWeight) / weightRange) * innerHeight;
  };

  const getXForDate = (dateStr: string) => {
    const curMs = new Date(dateStr).getTime();
    const ratio = Math.max(0, Math.min(1, (curMs - startDateMs) / totalDurationMs));
    return padding.left + ratio * innerWidth;
  };

  const projectedPath = projectionPoints
    .map((p, idx) => {
      const x = padding.left + (p.day / totalDays) * innerWidth;
      const y = getY(p.projectedWeight);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const realPath = effectiveLogs
    .map((l, idx) => {
      const x = getXForDate(l.date);
      const y = getY(l.weightKg);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newWeight);
    if (!isNaN(w) && w > 30 && w < 300) {
      onAddWeight(w, newDate, newNotes);
      setNewWeight('');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Target & Projection Summary */}
      <div className="bg-gradient-to-br from-[#0a142c] via-[#0b1735] to-[#070e20] border border-[#1a2d56] rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#17284f] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" /> Plano de Evolução
              </span>
              <span className="text-xs font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                {profile.hasActiveGoal ? `${profile.targetDays} Dias` : 'Modo Livre'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white">
              {profile.hasActiveGoal
                ? profile.goal === 'lose_weight'
                  ? `Meta: Queimar ${Math.abs(profile.projectedWeightChangeKg)} kg`
                  : profile.goal === 'gain_weight'
                  ? `Meta: Ganhar +${profile.projectedWeightChangeKg} kg`
                  : `Meta: Recomposição Corporal`
                : 'Modo Livre (Sem prazo fixo)'}
            </h3>
          </div>

          {/* Clean, balanced days presets and goal action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            {profile.hasActiveGoal && (
              <div className="grid grid-cols-5 gap-1 bg-[#060c19] p-1.5 rounded-2xl border border-[#17284f] w-full sm:w-auto">
                {[30, 45, 60, 75, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => onUpdateTargetDays(d)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                      profile.targetDays === d
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={onOpenSetGoalModal}
              className="px-4 py-2.5 rounded-xl bg-[#122247] hover:bg-[#182f61] text-amber-200 border border-[#a16207]/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Target className="w-4 h-4 text-amber-400" />
              {profile.hasActiveGoal ? 'Ajustar Meta' : 'Definir Meta'}
            </button>
          </div>
        </div>

        {/* 4 Stat Cards - Clean and readable */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#060c19] border border-[#17284f] p-3.5 sm:p-4 rounded-2xl">
            <span className="text-xs font-semibold text-slate-400 uppercase">Peso Inicial</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
              {initialWeight.toFixed(1)} <span className="text-xs text-slate-400 font-sans">kg</span>
            </div>
          </div>

          <div className="bg-[#060c19] border border-[#17284f] p-3.5 sm:p-4 rounded-2xl">
            <span className="text-xs font-semibold text-slate-400 uppercase">Peso Atual</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
              {latestWeight.toFixed(1)} <span className="text-xs text-slate-400 font-sans">kg</span>
            </div>
          </div>

          <div className="bg-[#060c19] border border-[#17284f] p-3.5 sm:p-4 rounded-2xl">
            <span className="text-xs font-semibold text-slate-400 uppercase">Variação Real</span>
            <div
              className={`text-xl sm:text-2xl font-black mt-1 font-mono flex items-center gap-1 ${
                weightChange <= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {weightChange <= 0 ? (
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              ) : (
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              )}
              {weightChange > 0 ? `+${weightChange}` : weightChange} kg
            </div>
          </div>

          <div className="bg-[#060c19] border border-amber-500/30 p-3.5 sm:p-4 rounded-2xl">
            <span className="text-xs font-semibold text-amber-400 uppercase">
              {profile.hasActiveGoal ? `Meta (${profile.targetDays}d)` : 'Meta Final'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1 font-mono">
              {profile.projectedFinalWeight.toFixed(1)}{' '}
              <span className="text-xs text-amber-500 font-sans">kg</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              Gráfico de Peso • Meta de {profile.targetDays} Dias
            </h4>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-500/50" />
              <span className="text-slate-200 font-medium">Peso Real</span>
            </div>
            {profile.hasActiveGoal && (
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#b45309]" />
                <span className="text-slate-300 font-medium">Curva da Meta ({profile.targetDays}d)</span>
              </div>
            )}
          </div>
        </div>

        {/* SVG Drawing - 100% responsive, never overflows */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto"
            style={{ overflow: 'visible' }}
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yVal = minWeight + pct * weightRange;
              const yPos = getY(yVal);
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={chartWidth - padding.right}
                    y2={yPos}
                    stroke="#17284f"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 8}
                    y={yPos + 4}
                    fill="#94a3b8"
                    fontSize="11"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {yVal.toFixed(1)}kg
                  </text>
                </g>
              );
            })}

            {/* Projected Path (if goal is active) - Ochre / Bronze */}
            {profile.hasActiveGoal && (
              <path
                d={projectedPath}
                fill="none"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                opacity="0.85"
              />
            )}

            {/* Real Weight Curve - Gold & Mustard */}
            {effectiveLogs.length > 1 && (
              <path
                d={realPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Real Weight Points */}
            {effectiveLogs.map((l, idx) => {
              const x = getXForDate(l.date);
              const y = getY(l.weightKg);
              return (
                <circle
                  key={`real-${idx}`}
                  cx={x}
                  cy={y}
                  r={5}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer hover:scale-125 transition-all"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      x,
                      y,
                      date: new Date(l.date + 'T12:00:00').toLocaleDateString('pt-BR'),
                      weight: l.weightKg,
                      isProjected: false,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}

            {/* Tooltip */}
            {hoveredPoint && (
              <g>
                <rect
                  x={hoveredPoint.x - 65}
                  y={hoveredPoint.y - 48}
                  width="130"
                  height="40"
                  rx="8"
                  fill="#060c19"
                  stroke={hoveredPoint.isProjected ? '#d97706' : '#f59e0b'}
                  strokeWidth="1.5"
                />
                <text
                  x={hoveredPoint.x}
                  y={hoveredPoint.y - 32}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {hoveredPoint.weight.toFixed(1)} kg{' '}
                  <tspan fill="#cbd5e1" fontSize="9">
                    {hoveredPoint.isProjected ? '(Meta)' : '(Real)'}
                  </tspan>
                </text>
                <text
                  x={hoveredPoint.x}
                  y={hoveredPoint.y - 18}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {hoveredPoint.date}
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* WEIGH-IN & LOG TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-md h-fit">
          <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-400" />
            Registrar Nova Pesagem
          </h4>
          <p className="text-xs text-slate-300 mb-4">
            Acompanhe o peso corporal de forma consistente
          </p>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Peso em kg
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 78.5"
                required
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#060c19] border border-[#17284f] rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Data</label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-4 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Notas (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Em jejum, boa noite de sono..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-4 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
            >
              <Plus className="w-4 h-4" /> Salvar Pesagem
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-md">
          <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            Histórico Cronológico de Pesagens ({effectiveLogs.length})
          </h4>
          <p className="text-xs text-slate-300 mb-4">
            Pesagens salvas localmente
          </p>

          {/* Mobile Cards View (Zero horizontal scroll! Perfectly fits on any smartphone) */}
          <div className="sm:hidden space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {effectiveLogs.map((log, idx) => {
              const isInitialRef = log.id === 'wl-initial-ref' || log.id.startsWith('wl-initial-ref') || (idx === 0 && log.date === initialDateStr);
              const prevLog = effectiveLogs[idx - 1];
              const diff = prevLog ? Number((log.weightKg - prevLog.weightKg).toFixed(1)) : 0;

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                    isInitialRef
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-100'
                      : 'bg-[#060c19] border-[#17284f] text-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-300 font-semibold text-[11px]">
                        {new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      {idx === 0 ? (
                        <span className="text-amber-400 font-bold text-[10px] bg-amber-500/15 px-1.5 py-0.5 rounded">Ponto Zero</span>
                      ) : diff <= 0 ? (
                        <span className="text-amber-300 font-bold text-[10px] bg-amber-500/15 px-1.5 py-0.5 rounded">{diff} kg</span>
                      ) : (
                        <span className="text-amber-500 font-bold text-[10px] bg-amber-500/15 px-1.5 py-0.5 rounded">+{diff} kg</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      {isInitialRef ? 'Referência Inicial de Cadastro' : (log.notes || 'Sem observações')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-mono font-bold text-white">
                      {log.weightKg.toFixed(1)} kg
                    </span>
                    {!isInitialRef ? (
                      <button
                        onClick={() => onDeleteWeight(log.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-[#122247] transition-colors"
                        title="Excluir pesagem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-mono font-bold">Base</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#0a142c] text-slate-300 border-b border-[#1a2d56]">
                <tr>
                  <th className="py-2 px-3 font-semibold">Data</th>
                  <th className="py-2 px-3 font-semibold">Peso (kg)</th>
                  <th className="py-2 px-3 font-semibold">Diferença</th>
                  <th className="py-2 px-3 font-semibold">Notas</th>
                  <th className="py-2 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17284f]">
                {effectiveLogs.map((log, idx) => {
                  const isInitialRef = log.id === 'wl-initial-ref' || log.id.startsWith('wl-initial-ref') || (idx === 0 && log.date === initialDateStr);
                  const prevLog = effectiveLogs[idx - 1];
                  const diff = prevLog ? Number((log.weightKg - prevLog.weightKg).toFixed(1)) : 0;

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-[#122247]/50 transition-colors ${
                        isInitialRef ? 'bg-amber-500/5 text-amber-100 font-medium' : 'text-slate-200'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        {log.weightKg.toFixed(1)} kg
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {idx === 0 ? (
                          <span className="text-amber-400 font-bold text-[10px]">Ponto Zero</span>
                        ) : diff <= 0 ? (
                          <span className="text-amber-300 font-bold">{diff} kg</span>
                        ) : (
                          <span className="text-amber-500 font-bold">+{diff} kg</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{log.notes || '-'}</span>
                          {isInitialRef && (
                            <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                              <ShieldCheck className="w-3 h-3 text-amber-400" /> Referência Inicial (Cadastro)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isInitialRef ? (
                          <span className="text-[10px] text-slate-500 font-mono italic px-1">Referência</span>
                        ) : (
                          <button
                            onClick={() => onDeleteWeight(log.id)}
                            className="text-slate-600 hover:text-rose-400 p-1"
                            title="Excluir pesagem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
