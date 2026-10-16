import React, { useState } from 'react';
import {
  UserProfile,
  FoodLogItem,
  WorkoutSession,
  WeightLog,
  AICoachFeedback,
  HabitItem,
} from '../types/fitness';
import { generateMathematicalCoachFeedback } from '../utils/offlineCoachMath';
import {
  Flame,
  Dumbbell,
  Scale,
  Sparkles,
  Utensils,
  Calendar,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Target,
  ArrowRight,
  Droplet,
  Loader2,
  RefreshCw,
  CheckSquare,
} from 'lucide-react';

interface DashboardTabProps {
  profile: UserProfile;
  foodLogs: FoodLogItem[];
  workouts: WorkoutSession[];
  weightLogs: WeightLog[];
  coachFeedback: AICoachFeedback;
  habits?: HabitItem[];
  onNavigateTab: (tab: 'dashboard' | 'nutrition' | 'hydration' | 'workouts' | 'habits' | 'charts' | 'photos' | 'profile') => void;
  onOpenSetGoalModal: () => void;
  onUpdateCoachFeedback: (feedback: AICoachFeedback) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  profile,
  foodLogs,
  workouts,
  weightLogs,
  coachFeedback,
  habits,
  onNavigateTab,
  onOpenSetGoalModal,
  onUpdateCoachFeedback,
}) => {
  const [isRefreshingCoach, setIsRefreshingCoach] = useState(false);

  // Today's logs (starts 0 calories if empty)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFoods = foodLogs.filter((f) => f.date === todayStr);
  const totalCalsToday = todayFoods.reduce((acc, cur) => acc + cur.calories, 0);
  const totalProteinToday = todayFoods.reduce((acc, cur) => acc + cur.protein, 0);
  const totalCarbsToday = todayFoods.reduce((acc, cur) => acc + cur.carbs, 0);
  const totalFatToday = todayFoods.reduce((acc, cur) => acc + cur.fat, 0);

  // Habits status today
  const completedHabitsToday = (habits || []).filter((h) =>
    h.completedDates.includes(todayStr)
  ).length;
  const totalHabits = (habits || []).length;

  const targetCalorieBudget = profile.hasActiveGoal ? profile.targetCalories : profile.tdee;
  const caloriesRemaining = targetCalorieBudget - totalCalsToday;
  const calPercent = Math.min(100, Math.round((totalCalsToday / targetCalorieBudget) * 100));

  // Current Weight
  const currentWeight = weightLogs[weightLogs.length - 1]?.weightKg ?? profile.currentWeight;
  const startWeight = weightLogs[0]?.weightKg ?? profile.startWeight;
  const weightChange = Number((currentWeight - startWeight).toFixed(1));

  // Days progress
  const totalDays = profile.targetDays || 60;
  const startDate = new Date(profile.startDate || new Date());
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - startDate.getTime());
  const daysPassed = Math.min(totalDays, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, totalDays - daysPassed);

  const workoutToday = workouts.find((w) => w.date === todayStr);

  const handleRefreshCoachAdvice = () => {
    setIsRefreshingCoach(true);
    setTimeout(() => {
      const feedback = generateMathematicalCoachFeedback({
        profile,
        foodLogs,
        workouts,
      });
      onUpdateCoachFeedback(feedback);
      setIsRefreshingCoach(false);
    }, 250);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner - Deep Navy with Gold accents */}
      <div className="bg-gradient-to-r from-[#0a142c] via-[#0d1a38] to-[#12244f] border border-[#1a2d56] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Visão Geral do Dia
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-300 font-mono">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Olá, {profile.name}! 🌟
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            {profile.hasActiveGoal ? (
              profile.goal === 'lose_weight'
                ? `Meta ativa: queimar gordura com déficit de ${Math.abs(profile.calorieAdjustment)} kcal por ${profile.targetDays} dias.`
                : profile.goal === 'gain_weight'
                ? `Meta ativa: hipertrofia com superávit de +${profile.calorieAdjustment} kcal por ${profile.targetDays} dias.`
                : `Meta de equilíbrio calórico em andamento (${profile.targetDays} dias).`
            ) : (
              'Você está no Modo Livre. Registre seus treinos, cargas e alimentação quando quiser!'
            )}
          </p>

          {totalHabits > 0 && (
            <button
              onClick={() => onNavigateTab('habits')}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#060c19] border border-[#1a2d56] hover:border-amber-400/50 text-xs text-slate-300 hover:text-white transition-all shadow-sm group"
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>
                Hábitos de Hoje:{' '}
                <strong className="text-amber-400 font-mono">
                  {completedHabitsToday} de {totalHabits}
                </strong>{' '}
                concluídos
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Highlight Button: Gold/Mustard */}
          <button
            onClick={() => onNavigateTab('nutrition')}
            className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
          >
            <Utensils className="w-4 h-4" /> Registrar Refeição
          </button>
          {/* Secondary Button: Bronze / Ochre transition */}
          <button
            onClick={() => onNavigateTab('workouts')}
            className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-[#112040] hover:bg-[#172a54] text-amber-100 font-bold text-xs flex items-center justify-center gap-2 border border-[#a16207]/50 shadow-sm transition-all"
          >
            <Dumbbell className="w-4 h-4 text-amber-400" /> Registrar Treino
          </button>
        </div>
      </div>

      {/* METRICS ROW: Calorie budget & Target Program Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calorie Dial Card - Deep Navy base */}
        <div className="lg:col-span-2 bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" /> Calorias & Nutrientes de Hoje
            </span>
            <button
              onClick={() => onNavigateTab('nutrition')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
            >
              Ver Diário de Refeições <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Progress Circle in Gold / Yellow */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-[#132247]"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - calPercent / 100)}
                  strokeLinecap="round"
                  className="text-amber-400 transition-all duration-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-white font-mono">{calPercent}%</span>
                <span className="text-xs text-slate-300 block">da meta</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-black text-white font-mono">{totalCalsToday}</span>
                  <span className="text-xs text-slate-300 ml-1.5">
                    / {targetCalorieBudget} kcal {profile.hasActiveGoal ? '(meta)' : '(TDEE)'}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-amber-400">
                  {caloriesRemaining >= 0
                    ? `${caloriesRemaining} kcal restantes`
                    : `+${Math.abs(caloriesRemaining)} kcal acima`}
                </div>
              </div>

              {/* Macro Bars */}
              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-rose-300">Proteínas</span>
                    <span className="text-slate-200 font-mono">
                      {totalProteinToday}g / {profile.targetProtein}g
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#122044] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (totalProteinToday / profile.targetProtein) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-amber-300">Carboidratos</span>
                    <span className="text-slate-200 font-mono">
                      {totalCarbsToday}g / {profile.targetCarbs}g
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#122044] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{
                        width: `${Math.min(100, (totalCarbsToday / profile.targetCarbs) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-amber-200">Gorduras</span>
                    <span className="text-slate-200 font-mono">
                      {totalFatToday}g / {profile.targetFat}g
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#122044] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#b45309] rounded-full"
                      style={{
                        width: `${Math.min(100, (totalFatToday / profile.targetFat) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Target Program / Exact Days Card - Deep Navy with Gold & Bronze */}
        <div className="bg-gradient-to-b from-[#0a142c] to-[#070e20] border border-[#1a2d56] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                {profile.hasActiveGoal ? `Plano de ${profile.targetDays} Dias` : 'Meta & Plano'}
              </span>
              {profile.hasActiveGoal ? (
                <span className="text-xs font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  {daysRemaining} dias restantes
                </span>
              ) : null}
            </div>

            {profile.hasActiveGoal ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-300">Peso Inicial:</span>
                  <span className="text-sm font-mono font-bold text-slate-200">
                    {startWeight.toFixed(1)} kg
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-300">Peso Atual:</span>
                  <span className="text-base font-mono font-black text-white">
                    {currentWeight.toFixed(1)} kg
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-300">Meta Projetada:</span>
                  <span className="text-base font-mono font-black text-amber-400">
                    {profile.projectedFinalWeight.toFixed(1)} kg
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#17284f]">
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>Progresso dos {profile.targetDays} dias</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {Math.round((daysPassed / totalDays) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#122044] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-full"
                      style={{ width: `${Math.min(100, (daysPassed / totalDays) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nenhum plano calórico ativo no momento. Você pode definir uma meta com prazo exato em dias a qualquer hora.
                </p>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-300">Peso Registrado:</span>
                  <span className="font-bold text-white font-mono">{currentWeight.toFixed(1)} kg</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={onOpenSetGoalModal}
              className="flex-1 py-2.5 rounded-xl bg-[#122247] hover:bg-[#192f61] text-amber-300 border border-[#a16207]/40 text-xs font-bold transition-colors"
            >
              {profile.hasActiveGoal ? 'Ajustar Meta' : 'Definir Meta Agora'}
            </button>
            <button
              onClick={() => onNavigateTab('charts')}
              className="py-2.5 px-3 rounded-xl bg-[#122247] hover:bg-[#192f61] text-slate-300 text-xs font-semibold border border-[#1a2d56]"
              title="Ver Gráficos"
            >
              <Scale className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* TODAY'S WORKOUT & ALIYAH COACH AI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-amber-400" /> Sessão de Academia de Hoje
              </span>
              {workoutToday && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  Concluído Hoje
                </span>
              )}
            </div>

            {workoutToday ? (
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white">{workoutToday.name}</h4>
                <p className="text-xs text-slate-300">
                  {workoutToday.exercises.length} exercícios registrados • {workoutToday.durationMinutes} min
                </p>
                {workoutToday.notes && (
                  <p className="text-xs text-slate-200 bg-[#060c19] p-2.5 rounded-xl border border-[#17284f]">
                    "{workoutToday.notes}"
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white">Nenhum treino registrado hoje</h4>
                <p className="text-xs text-slate-300">
                  Abra suas fichas de treino para registrar as cargas e repetições executadas no treino de hoje.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('workouts')}
            className="w-full mt-5 py-3 rounded-2xl bg-[#b45309]/15 hover:bg-[#b45309]/25 text-amber-300 border border-[#b45309]/40 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Dumbbell className="w-4 h-4" />
            {workoutToday ? 'Ver Detalhes do Treino' : 'Abrir Fichas de Treino'}
          </button>
        </div>

        {/* Aliyah Diagnóstico Fisiológico Matemático */}
        <div className="bg-gradient-to-br from-[#0a142c] to-[#0d1838] border border-[#a16207]/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Diagnóstico Fisiológico
                </span>
              </div>
              <button
                onClick={handleRefreshCoachAdvice}
                disabled={isRefreshingCoach}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                title="Recalcular diagnóstico com base matemática e fisiológica"
              >
                {isRefreshingCoach ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                )}
                Recalcular
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed bg-[#060c19]/80 p-3 rounded-xl border border-[#1a2d56] mb-3">
              "{coachFeedback.diagnostico}"
            </p>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Recomendações:
              </span>
              {coachFeedback.dicasPraticas.map((dica, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{dica}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#17284f] text-xs text-amber-300/90 italic">
            "{coachFeedback.motivacao}"
          </div>
        </div>
      </div>
    </div>
  );
};
