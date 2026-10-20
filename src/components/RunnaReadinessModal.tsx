import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  X,
  Moon,
  Battery,
  Flame,
  Activity,
  Heart,
  Sparkles,
} from 'lucide-react';
import { ReadinessCheckin, RunnaPlan } from '../types/runna';
import { saveReadinessCheckin, saveRunnaPlan } from '../utils/storage';

interface RunnaReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckinComplete: (checkin: ReadinessCheckin) => void;
  activePlan: RunnaPlan | null;
  onPlanUpdated: (plan: RunnaPlan) => void;
}

export const RunnaReadinessModal: React.FC<RunnaReadinessModalProps> = ({
  isOpen,
  onClose,
  onCheckinComplete,
  activePlan,
  onPlanUpdated,
}) => {
  const [painScore, setPainScore] = useState<number>(1);
  const [painLocation, setPainLocation] = useState<string>('');
  const [sleepQuality, setSleepQuality] = useState<number>(4);
  const [fatigueLevel, setFatigueLevel] = useState<number>(2);
  const [motivationLevel, setMotivationLevel] = useState<number>(4);
  const [autoAdaptPlan, setAutoAdaptPlan] = useState<boolean>(true);

  if (!isOpen) return null;

  // Scientific pain status logic [10, 14, 26]
  const isSafe = painScore <= 2;
  const isCaution = painScore >= 3 && painScore <= 5;
  const isDanger = painScore > 5;

  const status: 'safe' | 'caution' | 'danger' = isSafe
    ? 'safe'
    : isCaution
    ? 'caution'
    : 'danger';

  let recommendation = '';
  if (isSafe) {
    recommendation =
      'Nível de dor dentro da faixa fisiológica segura (0-2). Liberado para seguir a planilha com progressão normal [10].';
  } else if (isCaution) {
    recommendation =
      'Atenção (dor 3-5): Reduzir volume e intensidade na próxima sessão em 30%. Se a dor persistir por mais de algumas horas após o treino, não aumentar a quilometragem na semana seguinte [14, 26].';
  } else {
    recommendation =
      'Alerta Vermelho (dor > 5): Pule o próximo treino de corrida. Faça repouso relativo ou cross-training suave sem impacto e procure avaliação médica ou fisioterápica especializada [10].';
  }

  if (sleepQuality <= 2 || fatigueLevel >= 4) {
    recommendation +=
      ' Sono insuficiente ou fadiga extrema identificados: sono precário aumenta o risco de lesões musculoesqueléticas [16]. Considere descanso extra ou rodagem bem regenerativa.';
  }

  const handleSave = () => {
    const today = new Date().toISOString().split('T')[0];
    const checkin: ReadinessCheckin = {
      id: `checkin_${Date.now()}`,
      date: today,
      painScore,
      painLocation: painScore > 0 ? painLocation || 'Sensibilidade geral' : undefined,
      sleepQuality,
      fatigueLevel,
      motivationLevel,
      status,
      recommendation,
      createdAt: new Date().toISOString(),
    };

    saveReadinessCheckin(checkin);

    // Dynamic adaptation of next workout if requested and pain/fatigue is elevated
    if (autoAdaptPlan && activePlan && (isCaution || isDanger || sleepQuality <= 2)) {
      const updatedPlan = { ...activePlan };
      const currentWeekData = updatedPlan.weeks.find(
        (w) => w.weekNumber === updatedPlan.currentWeek
      );

      if (currentWeekData) {
        // Find next incomplete run workout
        const nextWorkout = currentWeekData.workouts.find((w) => !w.completed);
        if (nextWorkout) {
          if (isDanger) {
            nextWorkout.category = 'cross_training';
            nextWorkout.title = 'Descanso Ativo / Cross-Training Adaptado';
            nextWorkout.focus =
              'Substituição por recuperação sem impacto devido ao alerta de dor > 5 [10]';
            nextWorkout.adaptedDueToPain = true;
          } else if (isCaution) {
            nextWorkout.estimatedMinutes = Math.max(
              20,
              Math.round(nextWorkout.estimatedMinutes * 0.7)
            );
            if (nextWorkout.estimatedDistanceKm) {
              nextWorkout.estimatedDistanceKm =
                Math.round(nextWorkout.estimatedDistanceKm * 0.7 * 10) / 10;
            }
            nextWorkout.title += ' (Volume Reduzido -30%)';
            nextWorkout.focus = 'Sessão adaptada por dor nível 3-5 na escala analógica [14, 26]';
            nextWorkout.adaptedDueToPain = true;
          }
          saveRunnaPlan(updatedPlan);
          onPlanUpdated(updatedPlan);
        }
      }
    }

    onCheckinComplete(checkin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#091530] via-[#060e22] to-[#040815] border border-[#1d3363] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#142344] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`p-2.5 rounded-2xl border ${
                isSafe
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : isCaution
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
            >
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                MONITORAMENTO DIÁRIO DE PRONTIDÃO • SEÇÃO 6
              </span>
              <h2 className="text-lg font-black text-white tracking-tight">
                Check-in de Saúde, Dor & Sono
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

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Pain Scale (0 to 10) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-white block">
                  Nível de Dor Musculoesquelética (Escala 0 a 10)
                </label>
                <span className="text-[11px] text-slate-400">
                  Avalie qualquer incômodo em joelhos, canelas, pés ou tendões.
                </span>
              </div>
              <span
                className={`text-xl font-black px-3 py-1 rounded-xl border ${
                  isSafe
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isCaution
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {painScore} / 10
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={painScore}
              onChange={(e) => setPainScore(Number(e.target.value))}
              className="w-full accent-amber-400 h-2 bg-[#0d1c3a] rounded-lg cursor-pointer"
            />

            {/* Scale legend */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase pt-1">
              <div
                className={`p-2 rounded-xl border transition-all ${
                  isSafe
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow'
                    : 'bg-[#071126] border-[#132347] text-slate-500'
                }`}
              >
                0 - 2 Seguro
                <span className="block text-[9px] font-normal normal-case opacity-80">
                  Progredir normal
                </span>
              </div>
              <div
                className={`p-2 rounded-xl border transition-all ${
                  isCaution
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                    : 'bg-[#071126] border-[#132347] text-slate-500'
                }`}
              >
                3 - 5 Cautela
                <span className="block text-[9px] font-normal normal-case opacity-80">
                  Reduzir volume -30%
                </span>
              </div>
              <div
                className={`p-2 rounded-xl border transition-all ${
                  isDanger
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow'
                    : 'bg-[#071126] border-[#132347] text-slate-500'
                }`}
              >
                6 - 10 Alerta (Red Flag)
                <span className="block text-[9px] font-normal normal-case opacity-80">
                  Pular treino / Repouso
                </span>
              </div>
            </div>

            {painScore > 0 && (
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Local da dor (ex: canela direita, frente do joelho, sola do pé)..."
                  value={painLocation}
                  onChange={(e) => setPainLocation(e.target.value)}
                  className="w-full bg-[#060c1a] border border-[#172b54] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Sleep Quality */}
          <div className="space-y-2 pt-2 border-t border-[#132347]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-sky-400" />
                <label className="text-xs font-bold text-white">Qualidade do Sono (1 a 5)</label>
              </div>
              <span className="text-xs font-bold text-sky-300">{sleepQuality} / 5</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSleepQuality(s)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    sleepQuality === s
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-black'
                      : 'bg-[#071126] text-slate-300 border-[#14264e] hover:border-sky-500/50'
                  }`}
                >
                  {s}★
                </button>
              ))}
            </div>
          </div>

          {/* Fatigue Level */}
          <div className="space-y-2 pt-2 border-t border-[#132347]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-amber-400" />
                <label className="text-xs font-bold text-white">Nível de Fadiga Acumulada</label>
              </div>
              <span className="text-xs font-bold text-amber-300">
                {fatigueLevel === 1
                  ? 'Descansado'
                  : fatigueLevel === 2
                  ? 'Leve'
                  : fatigueLevel === 3
                  ? 'Moderada'
                  : fatigueLevel === 4
                  ? 'Alta'
                  : 'Exaustão'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFatigueLevel(f)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    fatigueLevel === f
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-[#071126] text-slate-300 border-[#14264e] hover:border-amber-500/50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Feedback Banner */}
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
              isSafe
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                : isCaution
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
            }`}
          >
            {isSafe ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : isCaution ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold uppercase tracking-wider block mb-1">
                Prescrição do Treinador:
              </span>
              {recommendation}
            </div>
          </div>

          {/* Option to automatically adapt the plan */}
          {(isCaution || isDanger) && (
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#081228] border border-[#172952] cursor-pointer">
              <input
                type="checkbox"
                checked={autoAdaptPlan}
                onChange={(e) => setAutoAdaptPlan(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-400"
              />
              <span className="text-xs text-slate-200">
                Ajustar dinamicamente o próximo treino da minha planilha para proteger minhas
                articulações e acelerar a recuperação.
              </span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-[#142344] bg-[#050b1c] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Salvar Check-in de Prontidão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
