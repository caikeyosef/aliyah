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
  Flame,
  RotateCcw,
  Sliders,
  CheckCircle2,
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

  // Calorie choice: whether user chose custom free number or default standard app recommendation
  const [isCustomCalories, setIsCustomCalories] = useState<boolean>(
    Boolean(profile.isCustomCalories)
  );
  const [customCalorieInput, setCustomCalorieInput] = useState<number>(
    profile.customCalories || profile.targetCalories || 2000
  );

  if (!isOpen) return null;

  // 1. Standard calculation for this plan (the default recommendation)
  const standardProfile = calculateCompleteProfile({
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
    isCustomCalories: false,
  });

  const recommendedKcal = standardProfile.recommendedCalories;

  // 2. Real-time preview profile considering user's calorie choice (custom free number vs standard recommended)
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
    isCustomCalories,
    customCalories: isCustomCalories ? Number(customCalorieInput) || recommendedKcal : undefined,
  });

  const handleSelectStandardCalories = () => {
    setIsCustomCalories(false);
    setCustomCalorieInput(recommendedKcal);
  };

  const handleSelectCustomCalories = (initialValue?: number) => {
    setIsCustomCalories(true);
    if (initialValue) {
      setCustomCalorieInput(initialValue);
    } else if (!customCalorieInput || customCalorieInput === 0) {
      setCustomCalorieInput(recommendedKcal);
    }
  };

  const handleAdjustCalories = (delta: number) => {
    setIsCustomCalories(true);
    setCustomCalorieInput((prev) => Math.max(800, Math.min(5000, (Number(prev) || recommendedKcal) + delta)));
  };

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

  const calorieDifference = isCustomCalories ? previewProfile.targetCalories - recommendedKcal : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060f]/85 backdrop-blur-md overflow-y-auto safe-area-top safe-area-bottom">
      <div className="relative w-full max-w-xl bg-[#0a142c] border border-[#1a2d56] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#17284f] flex items-center justify-between shrink-0 bg-[#081022]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Definir Plano & Calorias Diárias
              </h3>
              <p className="text-xs text-slate-300">
                Escolha as calorias recomendadas pelo app ou defina um número livre
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Free Mode Toggle */}
          <div className="p-3.5 bg-[#060c19] border border-[#17284f] rounded-2xl flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white">Modo Livre (Sem metas fixas de peso)</div>
              <div className="text-xs text-slate-400">Apenas acompanhe treinos e calorias sem cobrança de déficit</div>
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
              {useFreeMode ? 'Modo Livre Ativo' : 'Ativar Plano Focado'}
            </button>
          </div>

          {!useFreeMode && (
            <>
              {/* Goal Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. Objetivo Físico do Plano
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
                    2. Ritmo / Agressividade Padrão do Plano
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

              {/* SECTION: Escolha de Calorias (Padrão Recomendado vs Número Livre) */}
              <div className="bg-[#060c19] p-4 rounded-2xl border border-amber-500/30 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" /> 3. Meta de Calorias Diárias
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {previewProfile.targetCalories} kcal / dia
                  </span>
                </div>

                {/* Mode Selector Toggle: Padrão vs Livre */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Option 1: Padrão Recomendado */}
                  <button
                    type="button"
                    onClick={handleSelectStandardCalories}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      !isCustomCalories
                        ? 'bg-[#152957] border-amber-400 text-white shadow-md'
                        : 'bg-[#0a142c] border-[#17284f] text-slate-300 hover:border-[#1e3870]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${!isCustomCalories ? 'text-amber-400' : 'text-slate-500'}`} />
                        Calorias Recomendadas
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                        Padrão do App
                      </span>
                    </div>
                    <div className="text-lg font-black font-mono text-amber-300 mt-1">
                      {recommendedKcal} <span className="text-xs font-normal text-slate-400 font-sans">kcal/dia</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Baseado no seu TDEE ({standardProfile.tdee} kcal) e objetivo
                    </div>
                  </button>

                  {/* Option 2: Número Livre Personalizado */}
                  <button
                    type="button"
                    onClick={() => handleSelectCustomCalories()}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isCustomCalories
                        ? 'bg-[#152957] border-amber-400 text-white shadow-md'
                        : 'bg-[#0a142c] border-[#17284f] text-slate-300 hover:border-[#1e3870]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sliders className={`w-3.5 h-3.5 ${isCustomCalories ? 'text-amber-400' : 'text-slate-500'}`} />
                        Definir Número Livre
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                        Personalizado
                      </span>
                    </div>
                    <div className="text-lg font-black font-mono text-amber-300 mt-1">
                      {isCustomCalories ? customCalorieInput : recommendedKcal}{' '}
                      <span className="text-xs font-normal text-slate-400 font-sans">kcal/dia</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Digite qualquer quantidade livremente
                    </div>
                  </button>
                </div>

                {/* Free Custom Calories Controls */}
                {isCustomCalories && (
                  <div className="p-3.5 bg-[#0a142c] border border-amber-500/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-semibold text-slate-200">
                        Digite a quantidade livre de calorias:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="800"
                          max="6000"
                          step="10"
                          value={customCalorieInput}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomCalorieInput(val);
                          }}
                          className="w-24 px-2.5 py-1 bg-[#060c19] border border-amber-400/80 rounded-lg text-white font-mono font-black text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                        <span className="text-xs font-mono font-bold text-amber-400">kcal/dia</span>
                      </div>
                    </div>

                    {/* Quick Step Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Ajuste rápido:</span>
                      {[-200, -100, -50, 50, 100, 200].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleAdjustCalories(d)}
                          className="px-2 py-0.5 rounded-md bg-[#122247] hover:bg-[#182f61] border border-[#1a2d56] text-[11px] font-mono text-slate-200 hover:text-white cursor-pointer"
                        >
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleSelectStandardCalories}
                        className="px-2.5 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 ml-auto cursor-pointer"
                        title="Restaurar a recomendação padrão deste plano"
                      >
                        <RotateCcw className="w-3 h-3" /> Restaurar Padrão ({recommendedKcal} kcal)
                      </button>
                    </div>

                    {/* Range Slider for pleasant fine-tuning */}
                    <input
                      type="range"
                      min={Math.max(1000, recommendedKcal - 800)}
                      max={Math.min(4500, recommendedKcal + 800)}
                      step="25"
                      value={customCalorieInput}
                      onChange={(e) => setCustomCalorieInput(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />

                    {/* Real-time comparison note */}
                    <div className="p-2 bg-[#060c19] rounded-lg border border-[#17284f] text-[11px] text-slate-300 flex items-center justify-between">
                      <span>Comparação com o plano padrão:</span>
                      <span className="font-mono font-bold">
                        {calorieDifference === 0 ? (
                          <span className="text-emerald-400">Igual ao padrão ({recommendedKcal} kcal)</span>
                        ) : calorieDifference > 0 ? (
                          <span className="text-amber-400">+{calorieDifference} kcal a mais que o padrão</span>
                        ) : (
                          <span className="text-rose-400">{calorieDifference} kcal a menos que o padrão</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Duração do Plano (Dias Exatos) */}
              <div className="bg-[#060c19] p-4 rounded-2xl border border-[#17284f] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-400" /> 4. Dias Exatos do Plano
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

              {/* Mathematical Projection Preview */}
              <div className="bg-[#0a142c] border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Projeção com suas Calorias Escolhidas
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
                    <div className="text-xs text-slate-400 font-medium">Variação Calculada</div>
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

                {/* Macro distribution preview */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1 text-[11px]">
                  <div className="p-1.5 bg-[#060c19] rounded-lg border border-rose-500/20">
                    <span className="text-rose-400 font-bold block">Proteína</span>
                    <span className="font-mono text-white font-bold">{previewProfile.targetProtein}g</span>
                  </div>
                  <div className="p-1.5 bg-[#060c19] rounded-lg border border-amber-500/20">
                    <span className="text-amber-400 font-bold block">Carboidratos</span>
                    <span className="font-mono text-white font-bold">{previewProfile.targetCarbs}g</span>
                  </div>
                  <div className="p-1.5 bg-[#060c19] rounded-lg border border-sky-500/20">
                    <span className="text-sky-400 font-bold block">Gorduras</span>
                    <span className="font-mono text-white font-bold">{previewProfile.targetFat}g</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#17284f] bg-[#060c19] flex items-center justify-end gap-3 shrink-0">
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
            Salvar Plano ({previewProfile.targetCalories} kcal)
          </button>
        </div>
      </div>
    </div>
  );
};
