import React, { useState } from 'react';
import {
  UserProfile,
} from '../types/fitness';
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
} from '../utils/fitnessMath';
import {
  Settings,
  Flame,
  Sparkles,
  RotateCcw,
  BookOpen,
  Target,
  Database,
  Download,
  Upload,
  Check,
} from 'lucide-react';
import { exportAppData } from '../utils/backup';

interface ProfileGoalTabProps {
  profile: UserProfile;
  onOpenEditProfile: () => void;
  onOpenSetGoalModal: () => void;
  onResetData: () => void;
  onOpenBackupModal: () => void;
}

export const ProfileGoalTab: React.FC<ProfileGoalTabProps> = ({
  profile,
  onOpenEditProfile,
  onOpenSetGoalModal,
  onResetData,
  onOpenBackupModal,
}) => {
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const activityInfo = ACTIVITY_LABELS[profile.activityLevel];
  const goalInfo = GOAL_LABELS[profile.goal];

  const handleDirectExport = () => {
    try {
      const { filename } = exportAppData();
      setExportFeedback(`Backup "${filename}" baixado com sucesso!`);
      setTimeout(() => setExportFeedback(null), 4000);
    } catch {
      setExportFeedback('Erro ao baixar arquivo de backup.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Profile Summary Card - Deep Navy with Gold highlight */}
      <div className="bg-gradient-to-r from-[#0a142c] via-[#0d1a38] to-[#12244f] border border-[#1a2d56] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
            {profile.name.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">{profile.name}</h2>
              <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                {profile.hasActiveGoal ? goalInfo.badge : 'Modo Livre'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {profile.gender === 'male' ? 'Masculino' : 'Feminino'} • {profile.age} anos • {profile.height} cm • Peso: {profile.currentWeight} kg
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenSetGoalModal}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Target className="w-4 h-4" /> {profile.hasActiveGoal ? 'Ajustar Meta & Dias' : 'Definir Meta & Dias'}
          </button>
          <button
            onClick={onOpenEditProfile}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#122247] hover:bg-[#182f61] text-amber-200 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-amber-400" /> Dados Básicos
          </button>
        </div>
      </div>

      {/* Complete Math Breakdown */}
      <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            Cálculo Metabólico (Mifflin-St Jeor)
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Taxas diárias calibradas pelo seu perfil físico
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-[#060c19] border border-[#17284f] rounded-2xl p-4 flex flex-col justify-between h-28">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              1. Basal (TMB)
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {profile.bmr} <span className="text-xs font-normal text-slate-400 font-sans">kcal/dia</span>
            </div>
            <span className="text-xs text-slate-400">Energia vital em repouso</span>
          </div>

          <div className="bg-[#060c19] border border-[#17284f] rounded-2xl p-4 flex flex-col justify-between h-28">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              2. Gasto Total (TDEE)
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {profile.tdee} <span className="text-xs font-normal text-slate-400 font-sans">kcal/dia</span>
            </div>
            <span className="text-xs text-slate-400">Atividade: {activityInfo.title}</span>
          </div>

          <div className="bg-[#060c19] border border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between h-28">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> 3. Meta Diária
            </span>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {profile.targetCalories}{' '}
              <span className="text-xs font-normal text-amber-400/80 font-sans">kcal/dia</span>
            </div>
            <span className="text-xs text-amber-400/90 font-medium">
              {profile.hasActiveGoal
                ? profile.calorieAdjustment < 0
                  ? `Déficit: ${profile.calorieAdjustment} kcal`
                  : profile.calorieAdjustment > 0
                  ? `Superávit: +${profile.calorieAdjustment} kcal`
                  : 'Equilíbrio calórico'
                : 'Modo Livre'}
            </span>
          </div>
        </div>

        {/* Macros Breakdown Table */}
        <div className="bg-[#060c19]/80 rounded-2xl p-4 sm:p-5 border border-[#17284f] space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Distribuição Diária de Macronutrientes
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#0a142c] rounded-xl border border-rose-500/20 text-center">
              <div className="text-xs font-bold text-rose-300">Proteínas</div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                {profile.targetProtein}g
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">4 kcal/g</div>
            </div>

            <div className="p-3 bg-[#0a142c] rounded-xl border border-amber-500/20 text-center">
              <div className="text-xs font-bold text-amber-300">Carboidratos</div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                {profile.targetCarbs}g
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">4 kcal/g</div>
            </div>

            <div className="p-3 bg-[#0a142c] rounded-xl border border-amber-700/30 text-center">
              <div className="text-xs font-bold text-amber-200">Gorduras</div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                {profile.targetFat}g
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">9 kcal/g</div>
            </div>
          </div>
        </div>

        {/* Projection summary */}
        <div className="bg-[#060c19] rounded-2xl p-4 sm:p-5 border border-[#17284f] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Projeção do Plano ({profile.targetDays} Dias)
            </h4>
            <span className="text-xs font-mono font-bold text-slate-200">
              {profile.hasActiveGoal ? `${profile.calorieAdjustment} kcal/dia` : 'Modo Livre'}
            </span>
          </div>

          {profile.hasActiveGoal ? (
            <div className="grid grid-cols-3 gap-2 text-center py-2.5 bg-[#0a142c] rounded-xl border border-[#1a2d56]">
              <div>
                <div className="text-xs text-slate-400 font-medium">Peso Inicial</div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  {profile.startWeight.toFixed(1)} kg
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Variação Total</div>
                <div className="text-sm font-black text-amber-400 font-mono mt-0.5">
                  {profile.projectedWeightChangeKg > 0 ? '+' : ''}
                  {profile.projectedWeightChangeKg} kg
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Peso Final</div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  {profile.projectedFinalWeight.toFixed(1)} kg
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-300">
              Modo Livre ativo sem meta de déficit ou prazo fixo.
            </p>
          )}
        </div>
      </div>

      {/* Backup & Data Management Card - Export and Import */}
      <div className="bg-gradient-to-br from-[#0a142c] via-[#0d1a38] to-[#0a152d] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              Backup & Portabilidade dos Seus Dados
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Exporte seus treinos, cargas, refeições e pesagens em arquivo .json ou importe de outro aparelho.
            </p>
          </div>
          {exportFeedback && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> {exportFeedback}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleDirectExport}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Exportar Meus Dados (.json)
          </button>
          <button
            type="button"
            onClick={onOpenBackupModal}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-[#122247] hover:bg-[#192f61] text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-amber-400" /> Importar / Restaurar Backup
          </button>
        </div>
      </div>

      {/* Clean data button */}
      <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-400" />
            Limpar ou Reiniciar Dados (Zerar Tudo)
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Zera todas as fichas, treinos, refeições, hidratação e pesos para recomeçar do início.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetData}
          className="px-5 py-3 rounded-2xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-rose-950/20 hover:scale-[1.02] cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Zerar Tudo e Voltar ao Início
        </button>
      </div>
    </div>
  );
};
