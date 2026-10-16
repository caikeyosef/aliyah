import React, { useState, useEffect } from 'react';
import {
  DailyWaterRecord,
  WaterEntry,
  getStoredWaterForDate,
  saveStoredWaterForDate,
} from '../utils/storage';
import {
  Droplet,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Trophy,
  Check,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface HydrationTrackerProps {
  date: string;
  defaultTargetWaterMl: number;
}

interface ContainerPreset {
  id: string;
  name: string;
  amountMl: number;
  icon: string;
  label: string;
}

const CONTAINER_PRESETS: ContainerPreset[] = [
  { id: 'glass-sm', name: 'Copo Pequeno', amountMl: 150, icon: '🥛', label: '150 ml' },
  { id: 'glass-md', name: 'Copo Padrão', amountMl: 250, icon: '🥛', label: '250 ml' },
  { id: 'glass-lg', name: 'Copo Grande', amountMl: 350, icon: '🥤', label: '350 ml' },
  { id: 'bottle-sm', name: 'Garrafinha', amountMl: 500, icon: '🧴', label: '500 ml' },
  { id: 'bottle-md', name: 'Garrafa Média', amountMl: 750, icon: '🍶', label: '750 ml' },
  { id: 'bottle-lg', name: 'Shaker / Galão', amountMl: 1000, icon: '💧', label: '1.000 ml' },
];

export const HydrationTracker: React.FC<HydrationTrackerProps> = ({
  date,
  defaultTargetWaterMl,
}) => {
  const [record, setRecord] = useState<DailyWaterRecord>(() =>
    getStoredWaterForDate(date, defaultTargetWaterMl)
  );

  // Free ML input
  const [customMl, setCustomMl] = useState<string>('');

  // Edit Goal modal / inline state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState<number>(record.targetMl || defaultTargetWaterMl || 2500);

  // History collapse
  const [showHistory, setShowHistory] = useState(false);

  // Reload water whenever the date changes
  useEffect(() => {
    const loaded = getStoredWaterForDate(date, defaultTargetWaterMl);
    setRecord(loaded);
    setGoalInput(loaded.targetMl || defaultTargetWaterMl || 2500);
  }, [date, defaultTargetWaterMl]);

  // Persist record whenever changed
  const updateAndSaveRecord = (newRecord: DailyWaterRecord) => {
    setRecord(newRecord);
    saveStoredWaterForDate(newRecord);
  };

  const handleAddContainer = (preset: ContainerPreset) => {
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const newEntry: WaterEntry = {
      id: 'water-' + Date.now(),
      time: nowTime,
      amountMl: preset.amountMl,
      containerName: preset.name,
    };

    const newRecord: DailyWaterRecord = {
      ...record,
      consumedMl: record.consumedMl + preset.amountMl,
      entries: [newEntry, ...record.entries],
    };
    updateAndSaveRecord(newRecord);
  };

  const handleAddCustomMl = (amountToAdd?: number) => {
    const amount = amountToAdd !== undefined ? amountToAdd : parseInt(customMl, 10);
    if (isNaN(amount) || amount <= 0) return;

    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const newEntry: WaterEntry = {
      id: 'water-' + Date.now(),
      time: nowTime,
      amountMl: amount,
      containerName: `${amount} ml livres`,
    };

    const newRecord: DailyWaterRecord = {
      ...record,
      consumedMl: record.consumedMl + amount,
      entries: [newEntry, ...record.entries],
    };
    updateAndSaveRecord(newRecord);
    setCustomMl('');
  };

  const handleDeleteEntry = (entryId: string) => {
    const entry = record.entries.find((e) => e.id === entryId);
    if (!entry) return;

    const newRecord: DailyWaterRecord = {
      ...record,
      consumedMl: Math.max(0, record.consumedMl - entry.amountMl),
      entries: record.entries.filter((e) => e.id !== entryId),
    };
    updateAndSaveRecord(newRecord);
  };

  const handleSaveGoal = () => {
    const newTarget = Math.max(500, Math.min(10000, Number(goalInput) || 2500));
    const newRecord: DailyWaterRecord = {
      ...record,
      targetMl: newTarget,
    };
    updateAndSaveRecord(newRecord);
    setIsEditingGoal(false);
  };

  const handleResetDayWater = () => {
    const newRecord: DailyWaterRecord = {
      ...record,
      consumedMl: 0,
      entries: [],
    };
    updateAndSaveRecord(newRecord);
  };

  // Calculations
  const target = record.targetMl || defaultTargetWaterMl || 2500;
  const percentage = Math.round((record.consumedMl / target) * 100);
  const remainingMl = Math.max(0, target - record.consumedMl);
  const fillHeight = Math.min(100, Math.max(0, (record.consumedMl / target) * 100));
  const isGoalReached = record.consumedMl >= target && target > 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6">
      {/* Decorative ambient water glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Droplet className="w-5 h-5 fill-cyan-400" />
            </span>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Estação de Hidratação
              {isGoalReached && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" /> Meta Atingida!
                </span>
              )}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Acompanhe cada copo e garrafa do dia. Começa do 0ml até sua meta diária personalizada.
          </p>
        </div>

        {/* Change Goal Trigger */}
        <div className="flex items-center gap-2">
          {isEditingGoal ? (
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-700">
              <input
                type="number"
                step="50"
                min="500"
                max="10000"
                value={goalInput}
                onChange={(e) => setGoalInput(Number(e.target.value))}
                className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs text-center"
              />
              <span className="text-[10px] text-slate-400">ml</span>
              <button
                onClick={handleSaveGoal}
                className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg"
              >
                Salvar
              </button>
              <button
                onClick={() => setIsEditingGoal(false)}
                className="px-2 py-1 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingGoal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Meta: {(target / 1000).toFixed(1)}L ({target} ml)
            </button>
          )}

          {record.consumedMl > 0 && (
            <button
              onClick={handleResetDayWater}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
              title="Zerar água do dia"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Hydration Display (Visual Bottle Flask & Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
        {/* Animated Fluid Glass Bottle Flask (4 cols on desktop) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div className="relative w-36 h-60 sm:w-40 sm:h-64 rounded-[36px] p-2 bg-gradient-to-b from-slate-800/70 to-slate-950/90 border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col justify-end overflow-hidden">
            {/* Bottle cap lip */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-cyan-500/30 rounded-full border border-cyan-400/40" />

            {/* Scale markings */}
            <div className="absolute top-8 left-3 bottom-6 flex flex-col justify-between text-[9px] font-mono text-cyan-400/50 pointer-events-none select-none">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            {/* Rising Fluid with Wave SVG animation */}
            <div
              className="w-full rounded-[28px] relative transition-all duration-700 ease-out flex items-center justify-center overflow-hidden"
              style={{
                height: `${Math.max(6, fillHeight)}%`,
                background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 50%, #0369a1 100%)',
              }}
            >
              {/* Dynamic Wave Top */}
              <div className="absolute top-0 left-0 right-0 h-4 opacity-75">
                <svg
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                  className="w-full h-full text-cyan-200 fill-current animate-pulse"
                >
                  <path d="M0.00,49.98 C149.99,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" />
                </svg>
              </div>

              {/* Water Bubbles */}
              <div className="absolute inset-0 flex justify-around opacity-40 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDuration: '2s' }} />
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDuration: '1.4s' }} />
                <span className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDuration: '2.5s' }} />
              </div>
            </div>

            {/* Large Center Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <span className="text-3xl font-black text-white font-mono tracking-tight">
                {record.consumedMl}
                <span className="text-xs font-normal text-cyan-200 block font-sans">ml</span>
              </span>
              <span className="text-xs font-bold text-cyan-300 font-mono mt-0.5">
                {percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Status Numbers & Breakdown (8 cols) */}
        <div className="md:col-span-8 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consumido Hoje</span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {record.consumedMl}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">ml</span>
              </div>
              <div className="text-[10px] text-cyan-400 mt-0.5">
                {(record.consumedMl / 1000).toFixed(2)} Litros
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Meta Diária</span>
              <div className="text-2xl font-black text-cyan-300 font-mono mt-0.5">
                {target}{' '}
                <span className="text-xs font-normal text-cyan-500 font-sans">ml</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {(target / 1000).toFixed(2)} Litros
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Restante</span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {remainingMl}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">ml</span>
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                {isGoalReached ? 'Meta concluída!' : `Faltam ${remainingMl} ml`}
              </div>
            </div>
          </div>

          {/* Quick Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>0 ml</span>
              <span className="text-cyan-400 font-bold">{record.consumedMl} ml ({percentage}%)</span>
              <span>{target} ml</span>
            </div>
            <div className="h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                style={{ width: `${Math.min(100, (record.consumedMl / target) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-2xl text-xs text-cyan-300 leading-relaxed flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              A hidratação otimiza a queima de gordura, melhora o pump muscular durante os treinos e reduz a retenção líquida subcutânea.
            </span>
          </div>
        </div>
      </div>

      {/* COPOS E GARRAFAS (Presets) */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80 relative z-10">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Copos & Garrafas (Clique para adicionar):
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {CONTAINER_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleAddContainer(p)}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-cyan-500/15 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl group-hover:scale-110 transition-transform">{p.icon}</span>
                <span className="w-5 h-5 rounded-lg bg-slate-900 group-hover:bg-cyan-500 group-hover:text-slate-950 text-cyan-400 flex items-center justify-center text-xs font-bold transition-colors">
                  +
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-white group-hover:text-cyan-200">{p.name}</div>
                <div className="text-[11px] font-mono text-cyan-400 font-semibold">{p.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ML LIVRES (Custom Free Amount) */}
      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Adicionar ML Livres
            </span>
            <span className="text-[11px] text-slate-400">
              Digite qualquer quantidade exata de água ou use os atalhos rápidos
            </span>
          </div>

          {/* Quick pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[100, 200, 300, 400, 500].map((quick) => (
              <button
                key={quick}
                onClick={() => handleAddCustomMl(quick)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 text-slate-300 text-xs font-mono font-bold transition-all"
              >
                +{quick}ml
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="10"
              min="10"
              max="5000"
              placeholder="Digite os ML exatos (ex: 220, 380, 650)..."
              value={customMl}
              onChange={(e) => setCustomMl(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500 placeholder-slate-500"
            />
            <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">ml</span>
          </div>

          <button
            onClick={() => handleAddCustomMl()}
            disabled={!customMl || Number(customMl) <= 0}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Adicionar ML
          </button>
        </div>
      </div>

      {/* TODAY'S WATER SIPS / HISTORY */}
      {record.entries.length > 0 && (
        <div className="pt-1 border-t border-slate-800/80 relative z-10">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white py-1"
          >
            <span className="font-semibold flex items-center gap-1.5">
              <span>Registros de Hoje ({record.entries.length} goles/copos)</span>
            </span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showHistory && (
            <div className="space-y-1.5 mt-2 max-h-48 overflow-y-auto pr-1">
              {record.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-cyan-400">💧</span>
                    <span className="text-slate-200 font-medium">{entry.containerName}</span>
                    <span className="text-slate-500 text-[10px] font-mono">às {entry.time}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-cyan-300">+{entry.amountMl} ml</span>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Excluir este gole"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
