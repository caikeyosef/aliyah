import React, { useState } from 'react';
import {
  X,
  Footprints,
  Calendar,
  Timer,
  Play,
  Copy,
  Check,
  Flame,
  Activity,
  Heart,
  Info,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { RunnaWorkout, WorkoutBlock } from '../types/runna';

interface RunnaWorkoutDetailModalProps {
  workout: RunnaWorkout | null;
  isOpen: boolean;
  onClose: () => void;
  onStartGuided?: (workout: RunnaWorkout) => void;
}

export function estimateBlockMeters(block: WorkoutBlock): number {
  if (block.distanceMeters && block.distanceMeters > 0) {
    return block.distanceMeters;
  }
  const sec = block.durationSeconds;
  if (block.type === 'run_interval_hard') return Math.round(sec * 3.5); // ~12.6 km/h (~4:45/km)
  if (block.type === 'run_tempo') return Math.round(sec * 3.0); // ~10.8 km/h (~5:33/km)
  if (block.type === 'run_easy') return Math.round(sec * 2.6); // ~9.4 km/h (~6:25/km)
  if (block.type === 'stride') return Math.min(100, Math.round(sec * 4.0)); // ~70-100m acceleration
  // Walk, warmup, cooldown walk
  return Math.round(sec * 1.35); // ~4.9 km/h (~12:20/km)
}

export function formatSecondsToMinSec(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (s === 0) return `${m} min`;
  return `${m} min ${s}s`;
}

export function getZoneLabel(zone?: string): { name: string; badgeColor: string } {
  switch (zone) {
    case 'z1_facil':
      return {
        name: 'Zona 1 • Regenerativo Muito Leve (FC < 68%)',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    case 'z2_aerobico':
      return {
        name: 'Zona 2 • Aeróbico Leve / Ritmo Conversacional (FC 68-78%)',
        badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      };
    case 'z3_ritmo':
      return {
        name: 'Zona 3 • Ritmo Firme / Limiar Aeróbico (FC 78-86%)',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    case 'z4_limiar_mas':
      return {
        name: 'Zona 4 • Tiro Forte a 95-105% da VAM (FC 86-94%)',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      };
    case 'z5_tiro':
      return {
        name: 'Zona 5 • Esforço Máximo / Sprint',
        badgeColor: 'bg-red-600/30 text-red-300 border-red-500/40',
      };
    case 'caminhada':
    default:
      return {
        name: 'Caminhada Recuperativa / Aquecimento Ativo',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      };
  }
}

export const RunnaWorkoutDetailModal: React.FC<RunnaWorkoutDetailModalProps> = ({
  workout,
  isOpen,
  onClose,
  onStartGuided,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !workout) return null;

  const blocks = workout.blocks || [];

  // Metrics summary
  let totalRunSeconds = 0;
  let totalWalkSeconds = 0;
  let totalWarmupCooldownSeconds = 0;
  let totalMeters = 0;

  blocks.forEach((b) => {
    const meters = estimateBlockMeters(b);
    totalMeters += meters;
    if (b.type.includes('run')) {
      totalRunSeconds += b.durationSeconds;
    } else if (b.type === 'walk') {
      totalWalkSeconds += b.durationSeconds;
    } else {
      totalWarmupCooldownSeconds += b.durationSeconds;
    }
  });

  const totalMinutes = Math.round(
    blocks.reduce((acc, b) => acc + b.durationSeconds, 0) / 60
  );
  const totalKm = (totalMeters / 1000).toFixed(1);

  // Generate plain text summary to copy
  const handleCopySummary = () => {
    let text = `🏃 PLANO RUNNA: ${workout.title} (${workout.dayName})\n`;
    text += `⏱️ Duração: ${totalMinutes} min | 📍 Distância estimada: ~${totalKm} km (${totalMeters}m)\n`;
    text += `🎯 Foco: ${workout.focus}\n\n`;
    text += `--- ESTRUTURA DOS BLOCOS ---\n`;

    blocks.forEach((b, idx) => {
      const dur = formatSecondsToMinSec(b.durationSeconds);
      const m = estimateBlockMeters(b);
      text += `${idx + 1}. [${dur} | ~${m}m] ${b.label}\n`;
      text += `   Instrução: ${b.instruction}\n`;
    });

    if (workout.biomechanicsTip) {
      text += `\n💡 Dica Biomecânica: ${workout.biomechanicsTip}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-[#091530] via-[#060e22] to-[#040815] border border-[#1d3363] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Glow Header */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar */}
        <div className="p-5 sm:p-6 border-b border-[#142344] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400">
              <Footprints className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {workout.dayName}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Semana {workout.weekNumber}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                {workout.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#122247] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Quick Metrics Bar: Exact km, meters, duration, run vs walk */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#071126] border border-[#16274e] text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Distância Total
              </span>
              <span className="text-xl font-black text-amber-400 font-mono">
                ~{totalKm} km
              </span>
              <span className="text-[11px] text-slate-500 block font-mono">
                {totalMeters} metros
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#071126] border border-[#16274e] text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Tempo Total
              </span>
              <span className="text-xl font-black text-white font-mono">
                {totalMinutes} min
              </span>
              <span className="text-[11px] text-slate-500 block font-mono">
                {blocks.reduce((acc, b) => acc + b.durationSeconds, 0)} segundos
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#071126] border border-[#16274e] text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                Tempo de Corrida
              </span>
              <span className="text-xl font-black text-emerald-300 font-mono">
                {formatSecondsToMinSec(totalRunSeconds)}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {totalRunSeconds > 0
                  ? `${Math.round((totalRunSeconds / (totalMinutes * 60)) * 100)}% da sessão`
                  : '0%'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#071126] border border-[#16274e] text-center">
              <span className="text-[10px] uppercase font-bold text-sky-400 block">
                Tempo de Caminhada
              </span>
              <span className="text-xl font-black text-sky-300 font-mono">
                {formatSecondsToMinSec(totalWalkSeconds + totalWarmupCooldownSeconds)}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Recuperação & Aquec.
              </span>
            </div>
          </div>

          {/* Visual Timeline of Blocks */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                Sequência Proporcional dos Blocos ({blocks.length} etapas)
              </span>
              <span className="text-[11px] text-amber-400 font-mono font-bold">
                Total: {totalMinutes} min
              </span>
            </div>
            <div className="h-4 w-full bg-[#050a18] border border-[#152549] rounded-xl overflow-hidden flex p-0.5 gap-0.5">
              {blocks.map((b) => {
                const pct = (b.durationSeconds / (totalMinutes * 60 || 1)) * 100;
                let bg = 'bg-sky-500/50';
                if (b.type.includes('run')) bg = 'bg-gradient-to-r from-amber-500 to-yellow-400';
                if (b.type === 'warmup') bg = 'bg-emerald-500/70';
                if (b.type === 'cooldown') bg = 'bg-teal-500/70';
                return (
                  <div
                    key={b.id}
                    style={{ width: `${Math.max(2, pct)}%` }}
                    className={`${bg} h-full rounded-sm transition-all hover:brightness-125 cursor-pointer`}
                    title={`${b.label}: ${formatSecondsToMinSec(b.durationSeconds)} (~${estimateBlockMeters(b)}m)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Detailed Block-by-Block Cards List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Timer className="w-4 h-4 text-amber-400" />
                Passo a Passo Detalhado (Como Executar)
              </h3>
              <span className="text-xs text-slate-400">
                Você pode executar na rua, na esteira ou no relógio
              </span>
            </div>

            <div className="space-y-2.5">
              {blocks.map((block, index) => {
                const zone = getZoneLabel(block.targetPaceZone);
                const meters = estimateBlockMeters(block);
                const durFormatted = formatSecondsToMinSec(block.durationSeconds);
                const isRun = block.type.includes('run');
                const isWalk = block.type === 'walk';

                return (
                  <div
                    key={block.id || index}
                    className={`p-4 rounded-2xl border transition-all ${
                      isRun
                        ? 'bg-gradient-to-r from-[#0d1e3d] to-[#081226] border-amber-500/40 shadow-md shadow-amber-950/20'
                        : isWalk
                        ? 'bg-[#060e22] border-sky-500/30'
                        : 'bg-[#060c1c] border-[#16274e]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#142344] pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isRun
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-[#101f42] text-slate-300 border border-[#1e3870]'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <span className="text-sm font-black text-white block">
                            {block.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border inline-block mt-0.5 ${zone.badgeColor}`}
                          >
                            {zone.name}
                          </span>
                        </div>
                      </div>

                      {/* Exact time & meters pill */}
                      <div className="flex items-center gap-2 text-right">
                        <span className="text-xs font-black text-white bg-[#0e1d3e] border border-[#1d3870] px-3 py-1 rounded-xl font-mono">
                          ⏱ {durFormatted}
                        </span>
                        <span className="text-xs font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-xl font-mono">
                          📍 ~{meters} metros
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-medium pl-8">
                      {block.instruction}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Biomechanics Tip Callout */}
          {workout.biomechanicsTip && (
            <div className="p-4 rounded-2xl bg-[#07132e] border border-[#172c57] text-xs text-slate-300 flex items-start gap-3">
              <Footprints className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300 block mb-0.5">
                  Biomecânica Científica para este Treino:
                </span>
                {workout.biomechanicsTip}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-5 sm:p-6 border-t border-[#142344] bg-[#050b1c] flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <button
            onClick={handleCopySummary}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0c1836] border border-[#1b3469] text-xs font-bold text-slate-300 hover:text-white hover:bg-[#132450] transition-all cursor-pointer"
            title="Copiar resumo textual para Garmin, anotações ou WhatsApp"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Copiado para Área de Transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copiar Resumo dos Blocos</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
            >
              Fechar
            </button>

            {onStartGuided && blocks.length > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onStartGuided(workout);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950 stroke-[2.5]" />
                <span>Iniciar no Intervalômetro com Áudio</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
