import React, { useState, useEffect } from 'react';
import {
  X,
  Dumbbell,
  CheckCircle2,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Footprints,
  ShieldAlert,
  Info,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { STRENGTH_EXERCISES_CATALOG } from '../utils/runnaPlanGenerator';
import { StrengthExerciseItem } from '../types/runna';

interface RunnaStrengthModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory?: string;
  onCompleteRoutine?: () => void;
}

export const RunnaStrengthModal: React.FC<RunnaStrengthModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onCompleteRoutine,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(
    selectedCategory || 'foot_core'
  );
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);

  // Simple exercise timer (45s default for isometrics or sets)
  const [timerSeconds, setTimerSeconds] = useState<number>(45);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  if (!isOpen) return null;

  const currentExercise =
    STRENGTH_EXERCISES_CATALOG.find((e) => e.category === activeCategory) ||
    STRENGTH_EXERCISES_CATALOG[0];

  const categories = [
    { id: 'foot_core', label: 'Foot Core & Pés', icon: '🦶' },
    { id: 'glutes_pelvis', label: 'Glúteo & Pelve', icon: '🍑' },
    { id: 'calves_achilles', label: 'Panturrilhas & Aquiles', icon: '🦵' },
    { id: 'quads_knees', label: 'Quadríceps & Joelhos', icon: '🛡️' },
    { id: 'core_pelvic_floor', label: 'Core & Assoalho Pélvico', icon: '✨' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-[#091530] via-[#060e22] to-[#040815] border border-[#1d3363] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#142344] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Dumbbell className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                FORTALECIMENTO NEUROMUSCULAR PARA CORREDORES • SEÇÃO 5.1
              </span>
              <h2 className="text-lg font-black text-white tracking-tight">
                Fichas de Exercícios & Prevenção de Lesões
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

        {/* Category Pills */}
        <div className="p-3 bg-[#060c1c] border-b border-[#121f3d] flex items-center gap-2 overflow-x-auto scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveCategory(c.id);
                setTimerSeconds(45);
                setIsTimerRunning(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === c.id
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-[#091530] text-slate-400 hover:text-slate-200 border border-[#15274d]'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Main Exercise Card */}
          <div className="p-5 rounded-2xl bg-[#071126] border border-[#172952] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#142344] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Exercício Chave
                </span>
                <h3 className="text-xl font-black text-white">{currentExercise.name}</h3>
                <span className="text-xs text-slate-400">
                  Músculos Alvo: <strong className="text-slate-200">{currentExercise.targetMuscles}</strong>
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                  Dose Recomendada:
                </span>
                <span className="text-xs font-black text-white bg-[#0e1f47] px-3 py-1 rounded-lg border border-[#1f376d] inline-block">
                  {currentExercise.setsReps}
                </span>
              </div>
            </div>

            {/* Scientific Benefit */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Evidência Científica: </span>
                {currentExercise.clinicalBenefit}
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Como Executar com Biomecânica Perfeita:
              </h4>
              <div className="space-y-2">
                {currentExercise.instructions.map((inst, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-[#12244f] border border-[#23427f] text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    <span>{inst}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Cue */}
            <div className="p-3 rounded-xl bg-[#060c1a] border border-[#152549] text-xs text-slate-300 flex items-center gap-2">
              <Footprints className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-emerald-300">Dica Prática:</strong> {currentExercise.keyCue}
              </span>
            </div>

            {/* Reference Citation */}
            <div className="text-[10px] text-slate-500 italic">
              Fundamentação Bibliográfica: {currentExercise.citationRef}
            </div>
          </div>

          {/* Built-in Exercise Timer */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#071126] to-[#0a1838] border border-[#172b57] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cronômetro de Série / Isometria
                </span>
                <span className="text-2xl font-black text-white font-mono">
                  {timerSeconds}s
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTimerRunning ? 'Pausar' : 'Iniciar Série'}</span>
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(45);
                }}
                className="p-2 rounded-xl bg-[#0e1b38] border border-[#1a3163] text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Reiniciar 45s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-[#142344] bg-[#050b1c] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
          >
            Fechar
          </button>
          {onCompleteRoutine && (
            <button
              onClick={() => {
                onCompleteRoutine();
                onClose();
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir Treino de Fortalecimento</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
