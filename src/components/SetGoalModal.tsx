import React, { useState } from 'react';
import {
  FitnessGoal,
  GoalIntensity,
  UserProfile,
} from '../types/fitness';
import {
  calculateCompleteProfile,
} from '../utils/fitnessMath';
import {
  Target,
  Sparkles,
  Calendar,
  X,
  Check,
  TrendingDown,
  TrendingUp,
  Activity,
  ShieldCheck,
} from 'lucide-react';

interface SetGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveGoal: (updatedProfile: UserProfile) => void;
}

export const SetGoalModal: React.FC<SetGoalModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveGoal,
}) => {
  const [goal, setGoal] = useState<FitnessGoal>(
    profile.goal === 'none' ? 'lose_weight' : profile.goal
  );
  const [goalIntensity, setGoalIntensity] = useState<GoalIntensity>(
    profile.goalIntensity || 'moderate'
  );
  const [targetDays, setTargetDays] = useState<number>(profile.targetDays || 60);
  const [useFreeMode, setUseFreeMode] = useState<boolean>(!profile.hasActiveGoal);

  if (!isOpen) return null;

  // Real-time preview calculation
  const previewProfile = calculateCompleteProfile({
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    height: profile.height,
    currentWeight: profile.currentWeight,
    activityLevel: profile.activityLevel,
    goal: useFreeMode ? 'none' : goal,
    goalIntensity,
    hasActiveGoal: !useFreeMode,
    targetDays: Math.max(1, Number(targetDays) || 30),
    startDate: profile.startDate,
  });

  const handleSave = () => {
    onSaveGoal(previewProfile);
    onClose();
  };

  // Convert targetDays into target date string for preview
  const previewTargetDate = new Date();
  previewTargetDate.setDate(previewTargetDate.getDate() + targetDays);
  const targetDateFormatted = previewTargetDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const goalOptions: Array<{
    id: FitnessGoal;
    title: string;
    badge: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'lose_weight',
      title: 'Emagrecimento',
      badge: 'Déficit Calórico',
      icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
    },
    {
      id: 'gain_weight',
      title: 'Hipertrofia',
      badge: 'Superávit Calórico',
      icon: <TrendingUp className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'recomp',
      title: 'Recomposição',
      badge: 'Definição Foco',
      icon: <Activity className="w-4 h-4 text-yellow-400" />,
    },
    {
      id: 'maintain',
      title: 'Manter Físico',
      badge: 'Equilíbrio Calórico',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060f]/85 backdrop-blur-md overflow-y-auto safe-area-top safe-area-bottom">
      <div className="relative w-full max-w-xl bg-[#0a142c] border border-[#1a2d56] rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header - Clean, balanced, legible */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#17284f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Definir Objetivo & Prazo do Plano
              </h3>
              <p className="text-xs text-slate-300">
                Calcule a meta de peso e os dias exatos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#122247] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Free Mode Toggle */}
          <div className="p-3.5 bg-[#060c19] border border-[#17284f] rounded-2xl flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white">Modo Livre (Sem prazo ou déficit)</div>
              <div className="text-xs text-slate-400">Acompanhe treinos e peso livremente</div>
            </div>
            <button
              type="button"
              onClick={() => setUseFreeMode(!useFreeMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                useFreeMode
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-[#122247] border-[#1a2d56] text-slate-300 hover:text-white'
              }`}
            >
              {useFreeMode ? 'Modo Livre Ativo' : 'Ativar Plano'}
            </button>
          </div>

          {!useFreeMode && (
            <>
              {/* Goal Choice: Clean, equal-height symmetric cards without long tiny paragraphs */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Objetivo Físico
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {goalOptions.map((opt) => {
                    const isSelected = goal === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setGoal(opt.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                            : 'bg-[#060c19] border-[#17284f] text-slate-300 hover:bg-[#122247]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white flex items-center gap-1.5">
                            {opt.icon} {opt.title}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-bold w-fit ${
                            isSelected
                              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                              : 'bg-[#122247] text-slate-400'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intensity */}
              {goal !== 'maintain' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Intensidade do Ritmo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'mild', label: 'Suave', sub: goal === 'lose_weight' ? '-350 kcal' : '+250 kcal' },
                      { id: 'moderate', label: 'Moderado', sub: goal === 'lose_weight' ? '-500 kcal' : '+380 kcal' },
                      { id: 'aggressive', label: 'Acelerado', sub: goal === 'lose_weight' ? '-750 kcal' : '+550 kcal' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setGoalIntensity(opt.id as GoalIntensity)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          goalIntensity === opt.id
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm'
                            : 'bg-[#060c19] border-[#17284f] text-slate-300 hover:bg-[#122247]'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{opt.label}</div>
                        <div className="text-xs text-amber-400 font-mono font-bold mt-0.5">{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duração do Plano (Dias Exatos) - Perfectly aligned, no misaligned tiny text */}
              <div className="bg-[#060c19] p-4 rounded-2xl border border-[#17284f] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-400" /> Dias Exatos do Plano
                  </span>
                  <span className="text-base font-mono font-black text-amber-400">
                    {targetDays} dias
                  </span>
                </div>

                {/* Preset buttons */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[30, 45, 60, 75, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTargetDays(d)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all text-center cursor-pointer ${
                        targetDays === d
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 font-black shadow-md'
                          : 'bg-[#0a142c] border-[#17284f] text-slate-300 hover:text-white hover:bg-[#122247]'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>

                {/* Exact Custom Days Row */}
                <div className="flex items-center justify-between gap-3 bg-[#0a142c] p-2.5 rounded-xl border border-[#1a2d56]">
                  <span className="text-xs text-slate-300 font-medium">Dias personalizados:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="7"
                      max="365"
                      value={targetDays}
                      onChange={(e) => setTargetDays(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 px-2 py-1.5 bg-[#060c19] border border-[#17284f] rounded-lg text-white font-mono font-bold text-sm text-center focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-xs text-slate-400 font-medium">dias</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-[#17284f]">
                  <span>Previsão de término:</span>
                  <span className="font-bold text-white font-mono">{targetDateFormatted}</span>
                </div>
              </div>

              {/* Mathematical Projection Preview - 3 balanced columns */}
              <div className="bg-[#0a142c] border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Projeção do Resultado
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {previewProfile.targetCalories} kcal/dia
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-3 bg-[#060c19] rounded-xl border border-[#17284f]">
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Peso Atual</div>
                    <div className="text-sm font-bold text-white font-mono mt-1">
                      {profile.currentWeight.toFixed(1)} kg
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Variação</div>
                    <div className="text-sm font-black text-amber-400 font-mono mt-1">
                      {previewProfile.projectedWeightChangeKg > 0 ? '+' : ''}
                      {previewProfile.projectedWeightChangeKg} kg
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Peso Final</div>
                    <div className="text-sm font-bold text-white font-mono mt-1">
                      {previewProfile.projectedFinalWeight.toFixed(1)} kg
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#17284f] bg-[#060c19] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-[#122247] text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Salvar Plano
          </button>
        </div>
      </div>
    </div>
  );
};
