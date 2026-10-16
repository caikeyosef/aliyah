import React, { useState, useEffect } from 'react';
import {
  DailyWaterRecord,
  WaterEntry,
  getStoredWaterForDate,
  saveStoredWaterForDate,
  getTodayDateStr,
} from '../utils/storage';
import {
  Droplet,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  Check,
  Edit3,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award,
  Zap,
} from 'lucide-react';

interface HydrationTabProps {
  targetWaterMl: number;
  onUpdateTargetWater?: (newTarget: number) => void;
}

interface ContainerPreset {
  id: string;
  name: string;
  amountMl: number;
  icon: string;
  category: 'copo' | 'garrafa';
  desc: string;
}

const CONTAINER_PRESETS: ContainerPreset[] = [
  // Copos
  { id: 'c-150', name: 'Copo Pequeno', amountMl: 150, icon: '🥛', category: 'copo', desc: 'Cafezinho / Dose' },
  { id: 'c-200', name: 'Copo Americano', amountMl: 200, icon: '🥛', category: 'copo', desc: 'Copo tradicional' },
  { id: 'c-250', name: 'Copo Padrão', amountMl: 250, icon: '🥛', category: 'copo', desc: 'Copo d\'água de mesa' },
  { id: 'c-350', name: 'Copo Grande / Caneca', amountMl: 350, icon: '🥤', category: 'copo', desc: 'Caneca cheia' },
  // Garrafas
  { id: 'g-500', name: 'Squeeze / Garrafinha', amountMl: 500, icon: '🧃', category: 'garrafa', desc: 'Garrafa esportiva' },
  { id: 'g-750', name: 'Garrafa Média', amountMl: 750, icon: '🍶', category: 'garrafa', desc: 'Garrafa térmica' },
  { id: 'g-1000', name: 'Shaker de Academia', amountMl: 1000, icon: '💧', category: 'garrafa', desc: '1 Litro inteiro' },
  { id: 'g-1500', name: 'Galão Fitness', amountMl: 1500, icon: '🪣', category: 'garrafa', desc: '1,5 Litros' },
  { id: 'g-2000', name: 'Galão Gigante', amountMl: 2000, icon: '🏆', category: 'garrafa', desc: '2 Litros' },
];

export const HydrationTab: React.FC<HydrationTabProps> = ({
  targetWaterMl,
  onUpdateTargetWater,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [record, setRecord] = useState<DailyWaterRecord>(() =>
    getStoredWaterForDate(getTodayDateStr(), targetWaterMl || 2500)
  );

  // Free ML input
  const [customMl, setCustomMl] = useState<string>('');

  // Target customization state
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState<number>(record.targetMl || targetWaterMl || 2500);

  // Splash animation feedback
  const [lastAddedText, setLastAddedText] = useState<string | null>(null);

  // Reload water whenever date changes
  useEffect(() => {
    const loaded = getStoredWaterForDate(selectedDate, targetWaterMl || 2500);
    setRecord(loaded);
    setTargetInput(loaded.targetMl || targetWaterMl || 2500);
  }, [selectedDate, targetWaterMl]);

  const updateAndSaveRecord = (newRecord: DailyWaterRecord) => {
    setRecord(newRecord);
    saveStoredWaterForDate(newRecord);
  };

  const triggerAnimationToast = (text: string) => {
    setLastAddedText(text);
    setTimeout(() => setLastAddedText(null), 2500);
  };

  // Add container preset
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
    triggerAnimationToast(`+${preset.amountMl} ml adicionados (${preset.name})!`);
  };

  // Add custom ML
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
    triggerAnimationToast(`+${amount} ml livres adicionados com sucesso!`);
    setCustomMl('');
  };

  // Delete single entry
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

  // Reset entire day back to 0ml
  const handleResetDay = () => {
    if (window.confirm('Tem certeza que deseja zerar os registros de hidratação deste dia para 0 ml?')) {
      const newRecord: DailyWaterRecord = {
        ...record,
        consumedMl: 0,
        entries: [],
      };
      updateAndSaveRecord(newRecord);
      triggerAnimationToast('Água zerada com sucesso para 0 ml!');
    }
  };

  // Save updated daily target
  const handleSaveTarget = (overrideValue?: number) => {
    const newTarget = overrideValue || targetInput;
    if (newTarget < 500) return;

    const newRecord: DailyWaterRecord = {
      ...record,
      targetMl: newTarget,
    };
    updateAndSaveRecord(newRecord);
    if (onUpdateTargetWater) {
      onUpdateTargetWater(newTarget);
    }
    setIsEditingTarget(false);
    triggerAnimationToast(`Nova meta de ${newTarget} ml definida!`);
  };

  const shiftDate = (days: number) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Math Calculations
  const target = record.targetMl || targetWaterMl || 2500;
  const consumed = record.consumedMl;
  const percentage = Math.round((consumed / target) * 100);
  const remaining = Math.max(0, target - consumed);
  const isGoalReached = consumed >= target && target > 0;
  const fillHeight = Math.min(100, Math.max(0, (consumed / target) * 100));

  const coposPresets = CONTAINER_PRESETS.filter((p) => p.category === 'copo');
  const garrafasPresets = CONTAINER_PRESETS.filter((p) => p.category === 'garrafa');

  const isToday = selectedDate === getTodayDateStr();

  return (
    <div className="space-y-6 pb-16">
      {/* Date Navigation & Top Bar - Deep Navy */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Droplet className="w-7 h-7 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                Aba de Hidratação
              </h2>
              {isGoalReached && (
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> Meta Concluída!
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Começa rigorosamente do <strong className="text-amber-400">0 ml</strong> e preenche em tempo real até sua meta diária.
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-[#060c19] p-1.5 rounded-2xl border border-[#17284f]">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 hover:bg-[#122247] rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Dia Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 font-mono text-xs text-white">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
              })}
            </span>
            {isToday && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold font-sans">
                Hoje
              </span>
            )}
          </div>

          <button
            onClick={() => shiftDate(1)}
            className="p-2 hover:bg-[#122247] rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Próximo Dia"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stylized Visualizer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Animated Cylinder / Visual Hydro-Flask (5 cols on lg) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0a142c] via-[#0b1735] to-[#070e20] border border-[#1a2d56] rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Bottle Top Lip */}
          <div className="w-full flex items-center justify-between border-b border-[#17284f] pb-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Garrafa Virtual Inteligente
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-300">
                {consumed} / {target} ml
              </span>
              {consumed > 0 && (
                <button
                  onClick={handleResetDay}
                  className="px-2 py-1 rounded-lg bg-[#122040] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-[10px] font-semibold flex items-center gap-1 transition-all border border-[#1a2d56]"
                  title="Zerar água de hoje para 0ml"
                >
                  <RotateCcw className="w-3 h-3" /> Zerar p/ 0ml
                </button>
              )}
            </div>
          </div>

          {/* The Stylized Liquid Chamber */}
          <div className="relative w-48 h-80 sm:w-52 sm:h-84 rounded-[42px] p-2.5 bg-gradient-to-b from-[#0e1a38] to-[#050a17] border-2 border-[#1c305c] shadow-[0_0_35px_rgba(245,158,11,0.15)] flex flex-col justify-end overflow-hidden my-auto">
            {/* Bottle cap & nozzle */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-3 bg-amber-400/20 rounded-full border border-amber-300/40 backdrop-blur-sm" />

            {/* Scientific Scale Markings */}
            <div className="absolute top-8 left-4 bottom-8 flex flex-col justify-between text-[10px] font-mono font-bold text-amber-300/70 pointer-events-none select-none z-20">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-[1.5px] bg-amber-400 inline-block" /> 100% ({target}ml)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-[1px] bg-amber-400/60 inline-block" /> 75%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-[1px] bg-amber-400/60 inline-block" /> 50%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-[1px] bg-amber-400/60 inline-block" /> 25%
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <span className="w-2.5 h-[1.5px] bg-amber-400 inline-block" /> 0 ml (Início)
              </span>
            </div>

            {/* Rising Fluid Chamber with animated wave */}
            <div
              className="w-full rounded-[34px] relative transition-all duration-700 ease-out flex items-center justify-center overflow-hidden"
              style={{
                height: `${Math.max(5, fillHeight)}%`,
                background: isGoalReached
                  ? 'linear-gradient(180deg, #facc15 0%, #eab308 45%, #b45309 100%)'
                  : 'linear-gradient(180deg, #38bdf8 0%, #0284c7 45%, #0369a1 100%)',
                boxShadow: isGoalReached
                  ? 'inset 0 0 25px rgba(254,240,138,0.5), 0 0 20px rgba(234,179,8,0.4)'
                  : 'inset 0 0 25px rgba(255,255,255,0.25)',
              }}
            >
              {/* Dynamic top wave */}
              <div className="absolute top-0 left-0 right-0 h-4 opacity-80">
                <svg
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                  className={`w-full h-full fill-current animate-pulse ${isGoalReached ? 'text-amber-100' : 'text-cyan-100'}`}
                >
                  <path d="M0.00,49.98 C149.99,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" />
                </svg>
              </div>

              {/* Floating micro-bubbles */}
              <div className="absolute inset-0 flex justify-around opacity-40 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDuration: '2.1s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDuration: '1.5s' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDuration: '2.8s' }} />
                <span className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDuration: '1.8s' }} />
              </div>
            </div>

            {/* Center Glowing Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] z-20">
              <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {consumed}
                <span className="text-xs font-semibold text-slate-200 block font-sans -mt-1 text-center">
                  ml consumidos
                </span>
              </span>
              <span className="text-sm font-bold text-amber-300 font-mono mt-1.5 bg-[#060c19]/80 px-3 py-0.5 rounded-full border border-amber-500/40">
                {percentage}% da meta
              </span>
            </div>
          </div>

          {/* Quick reminder text */}
          <div className="w-full text-center text-xs text-slate-300 mt-4 pt-3 border-t border-[#17284f]">
            {isGoalReached ? (
              <span className="text-amber-300 font-bold flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-amber-400" /> Parabéns! Meta diária de {target}ml atingida!
              </span>
            ) : (
              <span>
                Faltam <strong className="text-amber-400 font-mono font-bold">{remaining} ml</strong> para bater sua meta hoje.
              </span>
            )}
          </div>
        </div>

        {/* Status Metrics & Custom Daily Goal (7 cols) */}
        <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-[#0a142c] border border-[#1a2d56] p-4 rounded-2xl shadow-md">
              <span className="text-[11px] text-slate-300 uppercase font-bold block">
                Consumido Hoje
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                {consumed} <span className="text-xs text-slate-400 font-normal font-sans">ml</span>
              </div>
              <p className="text-[11px] text-amber-400 font-mono mt-1">
                {(consumed / 1000).toFixed(2)} Litros
              </p>
            </div>

            <div className="bg-[#0a142c] border border-[#a16207]/40 p-4 rounded-2xl shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-amber-400 uppercase font-bold">
                  Meta Diária
                </span>
                <button
                  onClick={() => setIsEditingTarget(!isEditingTarget)}
                  className="text-xs text-amber-300 hover:text-white flex items-center gap-1 transition-colors"
                  title="Alterar meta diária"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Editar
                </button>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1">
                {target} <span className="text-xs text-amber-400 font-normal font-sans">ml</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-1">
                {(target / 1000).toFixed(2)} Litros / dia
              </p>
            </div>

            <div className="bg-[#0a142c] border border-[#1a2d56] p-4 rounded-2xl shadow-md">
              <span className="text-[11px] text-slate-300 uppercase font-bold block">
                Restante
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                {remaining} <span className="text-xs text-slate-400 font-normal font-sans">ml</span>
              </div>
              <p className="text-[11px] text-amber-400 font-semibold mt-1">
                {isGoalReached ? '100% atingido!' : `${percentage}% concluído`}
              </p>
            </div>
          </div>

          {/* EDIT DAILY TARGET EXPANDER */}
          {isEditingTarget && (
            <div className="p-4 bg-[#070e20] border border-[#a16207]/50 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  Definir Nova Meta Diária de Água
                </span>
                <button
                  onClick={() => setIsEditingTarget(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {[2000, 2500, 3000, 3500, 4000].map((quickTarget) => (
                  <button
                    key={quickTarget}
                    onClick={() => {
                      setTargetInput(quickTarget);
                      handleSaveTarget(quickTarget);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                      target === quickTarget
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400'
                        : 'bg-[#0a142c] border-[#17284f] text-slate-300 hover:bg-[#122247]'
                    }`}
                  >
                    {quickTarget / 1000}L ({quickTarget}ml)
                  </button>
                ))}
              </div>

              {/* Exact ML input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  step="50"
                  min="500"
                  max="10000"
                  placeholder="Ex: 2800"
                  value={targetInput}
                  onChange={(e) => setTargetInput(Number(e.target.value))}
                  className="flex-1 px-4 py-2 bg-[#0a142c] border border-[#1a2d56] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-400 font-bold"
                />
                <button
                  onClick={() => handleSaveTarget()}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs rounded-xl shadow-md hover:from-amber-400 hover:to-yellow-400 transition-all"
                >
                  Salvar Meta
                </button>
              </div>
            </div>
          )}

          {/* Full Linear Progress Bar */}
          <div className="bg-[#0a142c] border border-[#1a2d56] p-5 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">0 ml (Início)</span>
              <span className="text-amber-400 font-bold">{consumed} ml ({percentage}%)</span>
              <span className="text-slate-200 font-bold">{target} ml (Meta)</span>
            </div>
            <div className="h-4 bg-[#050a17] rounded-full border border-[#17284f] p-0.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isGoalReached
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.7)]'
                    : 'bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(56,189,248,0.5)]'
                }`}
                style={{ width: `${Math.min(100, (consumed / target) * 100)}%` }}
              />
            </div>
          </div>

          {/* Hydration Science & Benefits Box */}
          <div className="bg-gradient-to-r from-[#0a142c] via-[#0d1838] to-[#0a142c] border border-[#a16207]/30 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="leading-relaxed">
              <strong className="text-white block font-semibold mb-0.5">
                Por que a hidratação acelera seus resultados?
              </strong>
              <span>
                Músculos bem hidratados sintetizam proteínas com até 20% mais eficiência, reduzem o cortisol, mantêm o pump muscular nos treinos e aceleram a lipólise natural.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* COPOS (Section 1) */}
      <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥛</span>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Copos Rápidos
              </h3>
              <p className="text-xs text-slate-300">
                Clique no copo correspondente para somar imediatamente
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {coposPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleAddContainer(preset)}
              className="p-4 rounded-2xl bg-[#060c19] hover:bg-[#122247] border border-[#17284f] hover:border-amber-400/50 text-left transition-all duration-200 group flex flex-col justify-between shadow-sm hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl group-hover:scale-110 transition-transform">{preset.icon}</span>
                <span className="w-6 h-6 rounded-xl bg-[#0a142c] group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-400 flex items-center justify-center text-xs font-bold transition-all border border-[#17284f]">
                  +
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xs font-bold text-white group-hover:text-amber-200">
                  {preset.name}
                </div>
                <div className="text-xs font-mono text-amber-400 font-bold mt-0.5">
                  +{preset.amountMl} ml
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {preset.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* GARRAFAS E GALÕES (Section 2) */}
      <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧃</span>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Garrafas, Squeezes & Galões
              </h3>
              <p className="text-xs text-slate-300">
                Ideais para quem treina e leva água na academia ou no trabalho
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {garrafasPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleAddContainer(preset)}
              className="p-4 rounded-2xl bg-[#060c19] hover:bg-[#122247] border border-[#17284f] hover:border-amber-400/50 text-left transition-all duration-200 group flex flex-col justify-between shadow-sm hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl group-hover:scale-110 transition-transform">{preset.icon}</span>
                <span className="w-6 h-6 rounded-xl bg-[#0a142c] group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-400 flex items-center justify-center text-xs font-bold transition-all border border-[#17284f]">
                  +
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xs font-bold text-white group-hover:text-amber-200">
                  {preset.name}
                </div>
                <div className="text-xs font-mono text-amber-400 font-bold mt-0.5">
                  +{preset.amountMl >= 1000 ? `${(preset.amountMl / 1000).toFixed(1)}L` : `${preset.amountMl} ml`}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {preset.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ML LIVRES (Section 3 - Free Custom Volume) */}
      <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            Adicionar ML Livres
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Coloque qualquer quantidade exata de água ou use os botões rápidos de incremento
          </p>
        </div>

        {/* Quick Increment Chips - Bronze & Ochre transition */}
        <div className="flex flex-wrap items-center gap-2">
          {[50, 100, 150, 200, 250, 300, 400, 500].map((quick) => (
            <button
              key={quick}
              onClick={() => handleAddCustomMl(quick)}
              className="px-3.5 py-2 rounded-xl bg-[#060c19] hover:bg-gradient-to-r hover:from-amber-500 hover:to-yellow-500 hover:text-slate-950 border border-[#17284f] hover:border-amber-400 text-slate-200 text-xs font-mono font-bold transition-all"
            >
              +{quick} ml
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="10"
              min="10"
              max="5000"
              placeholder="Digite os ML exatos (ex: 180, 320, 650)..."
              value={customMl}
              onChange={(e) => setCustomMl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomMl();
                }
              }}
              className="w-full pl-4 pr-12 py-3 bg-[#060c19] border border-[#1a2d56] rounded-2xl text-white font-mono text-sm focus:outline-none focus:border-amber-400 placeholder-slate-400 font-bold"
            />
            <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-mono font-semibold">
              ml
            </span>
          </div>

          <button
            onClick={() => handleAddCustomMl()}
            disabled={!customMl || Number(customMl) <= 0}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-40 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Registrar ML Livres
          </button>
        </div>
      </div>

      {/* TODAY'S INTAKE HISTORY TABLE (Section 4) */}
      <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white font-heading">
              Histórico de Hidratação do Dia ({record.entries.length} registros)
            </h3>
          </div>
          {record.entries.length > 0 && (
            <button
              onClick={handleResetDay}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Zerar Tudo de Hoje
            </button>
          )}
        </div>

        {record.entries.length === 0 ? (
          <div className="p-8 text-center bg-[#060c19]/70 rounded-2xl border border-[#17284f]">
            <span className="text-3xl block mb-2">💧</span>
            <p className="text-xs font-semibold text-slate-200">
              Nenhum consumo registrado ainda hoje (começando rigorosamente do 0 ml).
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Clique em qualquer copo, garrafa ou adicione ML livres acima para começar sua hidratação!
            </p>
          </div>
        ) : (
          <div>
            {/* Mobile Cards List (Zero horizontal scroll) */}
            <div className="sm:hidden space-y-2 max-h-72 overflow-y-auto pr-1">
              {record.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 bg-[#060c19] border border-[#17284f] rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-amber-400 text-sm shrink-0">💧</span>
                    <div className="min-w-0">
                      <span className="font-semibold text-white truncate block">{entry.containerName}</span>
                      <span className="font-mono text-slate-400 text-[10px]">{entry.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-amber-300">+{entry.amountMl} ml</span>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                      title="Excluir este registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#0a142c] text-slate-300 border-b border-[#1a2d56]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Horário</th>
                    <th className="py-2.5 px-3 font-semibold">Recipiente / Tipo</th>
                    <th className="py-2.5 px-3 font-semibold">Quantidade</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17284f]">
                  {record.entries.map((entry) => (
                    <tr key={entry.id} className="text-slate-200 hover:bg-[#122247]/50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {entry.time}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                        <span className="text-amber-400">💧</span>
                        {entry.containerName}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                        +{entry.amountMl} ml
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Excluir este registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Floating Animated Toast - Gold */}
      {lastAddedText && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-4 py-3 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <span>✓</span> {lastAddedText}
        </div>
      )}
    </div>
  );
};
