import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  Activity,
  Flame,
  Footprints,
  Sparkles,
  Timer,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { RunnaWorkout, WorkoutBlock } from '../types/runna';
import { audioCoach } from '../utils/runnaAudioCoach';

interface RunnaGuidedSessionModalProps {
  workout: RunnaWorkout;
  isOpen: boolean;
  onClose: () => void;
  onWorkoutCompleted: (
    workoutId: string,
    painScore: number,
    rpeScore: number,
    notes: string
  ) => void;
}

export const RunnaGuidedSessionModal: React.FC<RunnaGuidedSessionModalProps> = ({
  workout,
  isOpen,
  onClose,
  onWorkoutCompleted,
}) => {
  const blocks = workout.blocks || [];

  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(0);
  const [secondsRemainingInBlock, setSecondsRemainingInBlock] = useState<number>(
    blocks[0]?.durationSeconds || 60
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedTotalSeconds, setElapsedTotalSeconds] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCompletionDialog, setShowCompletionDialog] = useState<boolean>(false);

  // Post workout check-in form
  const [postPainScore, setPostPainScore] = useState<number>(1);
  const [postRpeScore, setPostRpeScore] = useState<number>(6);
  const [postNotes, setPostNotes] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Current block
  const currentBlock: WorkoutBlock | undefined = blocks[currentBlockIndex];
  const nextBlock: WorkoutBlock | undefined = blocks[currentBlockIndex + 1];

  // Sync audio coach toggles
  useEffect(() => {
    audioCoach.setVoiceEnabled(voiceEnabled);
  }, [voiceEnabled]);

  useEffect(() => {
    audioCoach.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Reset when modal opens with new workout
  useEffect(() => {
    if (isOpen && blocks.length > 0) {
      setCurrentBlockIndex(0);
      setSecondsRemainingInBlock(blocks[0].durationSeconds);
      setIsRunning(false);
      setElapsedTotalSeconds(0);
      setShowCompletionDialog(false);
    }
  }, [isOpen, workout.id]);

  // Timer interval
  useEffect(() => {
    if (isRunning && !showCompletionDialog) {
      timerRef.current = setInterval(() => {
        setElapsedTotalSeconds((prev) => prev + 1);
        setSecondsRemainingInBlock((prev) => {
          // Check countdown ticks (3, 2, 1)
          if (prev === 4) audioCoach.playCountdownTick(3);
          if (prev === 3) audioCoach.playCountdownTick(2);
          if (prev === 2) audioCoach.playCountdownTick(1);

          if (prev <= 1) {
            // Block finished, advance to next
            if (currentBlockIndex < blocks.length - 1) {
              const nextIdx = currentBlockIndex + 1;
              setCurrentBlockIndex(nextIdx);
              const nextDuration = blocks[nextIdx].durationSeconds;
              audioCoach.announceBlockTransition(
                blocks[nextIdx].type,
                blocks[nextIdx].label
              );
              return nextDuration;
            } else {
              // Finished all blocks
              setIsRunning(false);
              audioCoach.playWorkoutComplete();
              audioCoach.speak('Treino concluído com sucesso! Parabéns pelo esforço!');
              setShowCompletionDialog(true);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, currentBlockIndex, blocks, showCompletionDialog]);

  if (!isOpen) return null;

  const handleTogglePlay = () => {
    if (!isRunning && currentBlock) {
      // First start voice cue
      audioCoach.announceBlockTransition(currentBlock.type, currentBlock.label);
    }
    setIsRunning(!isRunning);
  };

  const handleNextBlock = () => {
    if (currentBlockIndex < blocks.length - 1) {
      const nextIdx = currentBlockIndex + 1;
      setCurrentBlockIndex(nextIdx);
      setSecondsRemainingInBlock(blocks[nextIdx].durationSeconds);
      audioCoach.announceBlockTransition(blocks[nextIdx].type, blocks[nextIdx].label);
    } else {
      setIsRunning(false);
      setShowCompletionDialog(true);
    }
  };

  const handlePrevBlock = () => {
    if (currentBlockIndex > 0) {
      const prevIdx = currentBlockIndex - 1;
      setCurrentBlockIndex(prevIdx);
      setSecondsRemainingInBlock(blocks[prevIdx].durationSeconds);
    } else {
      setSecondsRemainingInBlock(blocks[0].durationSeconds);
    }
  };

  const handleFinishEarly = () => {
    setIsRunning(false);
    setShowCompletionDialog(true);
  };

  const handleSubmitCompletion = () => {
    onWorkoutCompleted(workout.id, postPainScore, postRpeScore, postNotes);
    onClose();
  };

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Progress percentage of active block
  const blockTotal = currentBlock?.durationSeconds || 1;
  const blockElapsed = blockTotal - secondsRemainingInBlock;
  const blockPct = Math.min(100, Math.max(0, (blockElapsed / blockTotal) * 100));

  // Total session progress
  const totalWorkoutSeconds = blocks.reduce((acc, b) => acc + b.durationSeconds, 0) || 1;
  const overallPct = Math.min(100, Math.max(0, (elapsedTotalSeconds / totalWorkoutSeconds) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#091530] via-[#050b1a] to-[#030611] border border-[#1d3363] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Glow ambient background */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 -mt-16 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
            currentBlock?.type.includes('run')
              ? 'bg-amber-500/20'
              : currentBlock?.type === 'walk'
              ? 'bg-sky-500/15'
              : 'bg-emerald-500/15'
          }`}
        />

        {/* Top bar with audio controls & close */}
        <div className="p-4 sm:p-5 border-b border-[#142344] flex items-center justify-between relative z-10">
          <div>
            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
              SESSÃO GUIADA EM TEMPO REAL • COACH RUNNA
            </span>
            <h2 className="text-sm sm:text-base font-black text-white truncate max-w-xs sm:max-w-md">
              {workout.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice toggle */}
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? 'Instruções de Voz Ativas' : 'Voz Silenciada'}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                voiceEnabled
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-[#09142b] border-[#182a52] text-slate-500'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={() => {
                setIsRunning(false);
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#122247] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Interval Coach Interface */}
        {!showCompletionDialog ? (
          <div className="p-5 sm:p-8 flex-1 overflow-y-auto flex flex-col items-center justify-between text-center relative z-10 space-y-6">
            {/* Block Category Pill */}
            <div className="flex items-center gap-2">
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border shadow-lg ${
                  currentBlock?.type.includes('run')
                    ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                    : currentBlock?.type === 'walk'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                    : currentBlock?.type === 'warmup'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-400'
                }`}
              >
                {currentBlock?.type.includes('run')
                  ? '⚡ CORRA AGORA'
                  : currentBlock?.type === 'walk'
                  ? '🚶 CAMINHADA RECUPERATIVA'
                  : currentBlock?.type === 'warmup'
                  ? '🔥 AQUECIMENTO'
                  : '🍃 DESAQUECIMENTO'}
              </span>

              <span className="text-xs text-slate-400 font-mono">
                Bloco {currentBlockIndex + 1} de {blocks.length}
              </span>
            </div>

            {/* Giant Active Block Label */}
            <div className="space-y-2 max-w-md">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentBlock?.label}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                {currentBlock?.instruction}
              </p>
            </div>

            {/* Giant Timer */}
            <div className="relative flex flex-col items-center justify-center my-2">
              <div className="text-6xl sm:text-7xl font-black tracking-tighter text-white font-mono drop-shadow-[0_0_25px_rgba(251,191,36,0.35)]">
                {formatTimer(secondsRemainingInBlock)}
              </div>
              <div className="text-[11px] font-bold text-amber-400/80 uppercase tracking-widest mt-1">
                Tempo restante no bloco
              </div>
            </div>

            {/* Block Progress Ring / Bar */}
            <div className="w-full max-w-md space-y-1.5">
              <div className="h-3 w-full bg-[#071126] border border-[#16274e] rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentBlock?.type.includes('run')
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-md shadow-amber-500/50'
                      : 'bg-gradient-to-r from-sky-500 to-teal-400'
                  }`}
                  style={{ width: `${blockPct}%` }}
                />
              </div>

              {/* Next Block Teaser */}
              {nextBlock && (
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                  <span>Próximo bloco:</span>
                  <span className="font-bold text-slate-200 truncate max-w-[200px]">
                    {nextBlock.label} ({Math.round(nextBlock.durationSeconds / 60)} min)
                  </span>
                </div>
              )}
            </div>

            {/* Biomechanics Tip Card */}
            <div className="w-full max-w-md p-3.5 rounded-2xl bg-[#071126]/80 border border-[#15274d] text-left flex items-start gap-3">
              <Footprints className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-amber-300 block">Dica de Biomecânica Runna:</span>
                {workout.biomechanicsTip ||
                  'Corra suave: aumente a cadência de passos (+10%) e aterrissando com menos barulho para diminuir as forças de impacto no joelho [28, 55].'}
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={handlePrevBlock}
                className="p-3.5 rounded-2xl bg-[#091530] border border-[#17284f] text-slate-300 hover:text-white hover:bg-[#122247] transition-all cursor-pointer"
                title="Bloco Anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={handleTogglePlay}
                className={`p-5 rounded-3xl font-black text-slate-950 shadow-2xl transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                  isRunning
                    ? 'bg-amber-400 shadow-amber-400/40 hover:brightness-110'
                    : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 shadow-amber-500/40 hover:scale-105'
                }`}
                title={isRunning ? 'Pausar' : 'Iniciar'}
              >
                {isRunning ? (
                  <Pause className="w-8 h-8 fill-slate-950 stroke-[2.5]" />
                ) : (
                  <Play className="w-8 h-8 fill-slate-950 stroke-[2.5] ml-1" />
                )}
              </button>

              <button
                onClick={handleNextBlock}
                className="p-3.5 rounded-2xl bg-[#091530] border border-[#17284f] text-slate-300 hover:text-white hover:bg-[#122247] transition-all cursor-pointer"
                title="Próximo Bloco"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Overall time & finish early button */}
            <div className="flex items-center justify-between w-full max-w-md pt-2 border-t border-[#122244] text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-amber-400" />
                <span>Total Decorrido: {formatTimer(elapsedTotalSeconds)}</span>
              </div>
              <button
                onClick={handleFinishEarly}
                className="text-amber-400 hover:underline font-bold cursor-pointer"
              >
                Concluir Treino
              </button>
            </div>
          </div>
        ) : (
          /* Post-Workout Completion Check-in */
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6 text-slate-200">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mb-1">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white">Treino Concluído com Sucesso!</h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Excelente consistência! Vamos registrar sua percepção de esforço e monitorar a dor
                articular conforme a Seção 6 do protocolo científico.
              </p>
            </div>

            {/* Pain Scale Check-in (0 to 10) */}
            <div className="p-4 rounded-2xl bg-[#071126] border border-[#16274e] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-white block">
                    Dor Articular Pós-Treino (Escala 0 a 10)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    0-2 Seguro | 3-5 Cautela (reduzir próximo) | &gt;5 Alerta
                  </span>
                </div>
                <span
                  className={`text-lg font-black px-2.5 py-0.5 rounded-lg border ${
                    postPainScore <= 2
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : postPainScore <= 5
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {postPainScore} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={postPainScore}
                onChange={(e) => setPostPainScore(Number(e.target.value))}
                className="w-full accent-amber-400 h-2 bg-[#091530] rounded-lg cursor-pointer"
              />
            </div>

            {/* RPE Perceived Exertion (1 to 10) */}
            <div className="p-4 rounded-2xl bg-[#071126] border border-[#16274e] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-white block">
                    Percepção Subjetiva de Esforço (RPE 1 a 10)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    1 = Muito Leve | 5-6 = Moderado / Conversacional | 9-10 = Esforço Máximo
                  </span>
                </div>
                <span className="text-lg font-black px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {postRpeScore} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={postRpeScore}
                onChange={(e) => setPostRpeScore(Number(e.target.value))}
                className="w-full accent-amber-400 h-2 bg-[#091530] rounded-lg cursor-pointer"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                Anotações Pessoais do Treino (opcional):
              </label>
              <textarea
                value={postNotes}
                onChange={(e) => setPostNotes(e.target.value)}
                placeholder="Como se sentiu? Clima, ritmo, sensação nas pernas..."
                rows={2}
                className="w-full bg-[#060c1a] border border-[#172b54] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={handleSubmitCompletion}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Salvar Treino na Minha Planilha</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
