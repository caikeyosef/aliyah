import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Calendar,
  Activity,
  CheckCircle2,
  Play,
  RotateCcw,
  ShieldAlert,
  Flame,
  Footprints,
  Heart,
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  AlertTriangle,
  Info,
  TrendingUp,
  Sliders,
  MessageSquare,
  Send,
  Zap,
  Gauge,
  Moon,
  Volume2,
  Copy,
  Check,
} from 'lucide-react';
import {
  RunnaPlan,
  RunnaProfile,
  RunnaWorkout,
  ReadinessCheckin,
  ACWRStatus,
} from '../types/runna';
import {
  loadRunnaPlan,
  saveRunnaPlan,
  loadRunnaProfile,
  saveRunnaProfile,
  loadReadinessCheckins,
} from '../utils/storage';
import { calculateACWR, generateRunnaPlan } from '../utils/runnaPlanGenerator';
import { RunnaIntakeModal } from './RunnaIntakeModal';
import { RunnaReadinessModal } from './RunnaReadinessModal';
import { RunnaGuidedSessionModal } from './RunnaGuidedSessionModal';
import { RunnaStrengthModal } from './RunnaStrengthModal';
import {
  RunnaWorkoutDetailModal,
  estimateBlockMeters,
  formatSecondsToMinSec,
} from './RunnaWorkoutDetailModal';

interface RunnaCoachTabProps {
  onOpenGpxAnalyzer?: () => void;
}

export const RunnaCoachTab: React.FC<RunnaCoachTabProps> = ({ onOpenGpxAnalyzer }) => {
  const [profile, setProfile] = useState<RunnaProfile | null>(null);
  const [plan, setPlan] = useState<RunnaPlan | null>(null);
  const [readinessLogs, setReadinessLogs] = useState<ReadinessCheckin[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [copiedWorkoutId, setCopiedWorkoutId] = useState<string | null>(null);
  const weeksScrollRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isIntakeOpen, setIsIntakeOpen] = useState<boolean>(false);
  const [isReadinessOpen, setIsReadinessOpen] = useState<boolean>(false);
  const [activeGuidedWorkout, setActiveGuidedWorkout] = useState<RunnaWorkout | null>(null);
  const [isStrengthModalOpen, setIsStrengthModalOpen] = useState<boolean>(false);
  const [selectedStrengthCategory, setSelectedStrengthCategory] = useState<string>('foot_core');
  const [selectedDetailWorkout, setSelectedDetailWorkout] = useState<RunnaWorkout | null>(null);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  // AI Assistant Chat state
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'coach'; text: string; time: string }[]
  >([
    {
      sender: 'coach',
      text: 'Olá! Sou o seu Treinador Runna baseado em evidências científicas. Posso orientar seus ritmos (Talk Test), cadência (+10%), monitoramento de dor (escala 0-10), fortalecimento do "foot core" ou sugerir adaptações de treino. Como posso ajudar hoje?',
      time: 'Agora',
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // Load stored Runna data on mount
  useEffect(() => {
    const storedProfile = loadRunnaProfile();
    const storedPlan = loadRunnaPlan();
    const storedReadiness = loadReadinessCheckins();

    if (storedProfile && storedPlan && storedProfile.intakeCompleted) {
      setProfile(storedProfile);
      setPlan(storedPlan);
      setSelectedWeek(storedPlan.currentWeek || 1);
    } else {
      // First time opening Runna: trigger setup wizard immediately as requested!
      setIsIntakeOpen(true);
      const defaultProfile: RunnaProfile = {
        intakeCompleted: false,
        level: 'inactive',
        goal: 'learn_to_run',
        targetDistance: '5k',
        daysPerWeek: 3,
        selectedDays: ['Segunda', 'Quarta', 'Sexta'],
        includeStrength: true,
        injuriesLast12Months: ['none'],
        currentTalkTestComfort: 'conversational',
        targetWeeks: 10,
        currentWeek: 1,
        preferredCadence: 172,
        usesShoeRotation: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const defaultPlan = generateRunnaPlan(defaultProfile);
      setProfile(defaultProfile);
      setPlan(defaultPlan);
      saveRunnaProfile(defaultProfile);
      saveRunnaPlan(defaultPlan);
    }

    setReadinessLogs(storedReadiness);
  }, []);

  // Compute Acute:Chronic Workload Ratio (ACWR) and 10% rule
  const currentWeekObj = plan?.weeks.find((w) => w.weekNumber === selectedWeek);
  const weeklyKmHistory =
    plan?.weeks.slice(0, selectedWeek).map((w) => ({
      weekLabel: `Sem ${w.weekNumber}`,
      km: w.weeklyTargetKm,
    })) || [];

  const currentWeekDoneKm =
    currentWeekObj?.workouts
      .filter((w) => w.completed)
      .reduce((acc, curr) => acc + (curr.completedDistanceKm || curr.estimatedDistanceKm || 0), 0) || 0;

  const acwrData: ACWRStatus = calculateACWR(
    weeklyKmHistory,
    currentWeekDoneKm > 0 ? currentWeekDoneKm : currentWeekObj?.weeklyTargetKm || 5
  );

  const latestReadiness = readinessLogs[0];

  // Scroll weeks carousel smoothly
  const scrollWeeksCarousel = (offset: number) => {
    if (weeksScrollRef.current) {
      weeksScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Center selected week pill in view
  useEffect(() => {
    if (weeksScrollRef.current) {
      const btn = document.getElementById(`week-btn-${selectedWeek}`);
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedWeek]);

  // Copy full workout details to clipboard
  const handleCopyWorkout = (workout: RunnaWorkout) => {
    const blocks = workout.blocks || [];
    let text = `🏃 PLANO RUNNA: ${workout.title} (${workout.dayName} - Semana ${workout.weekNumber})\n`;
    text += `🎯 Foco: ${workout.focus}\n`;
    text += `⏱️ Duração: ${workout.estimatedMinutes} min | 📍 Distância estimada: ~${workout.estimatedDistanceKm || 0} km\n`;
    if (workout.description) text += `📝 Descrição: ${workout.description}\n`;
    text += `\n--- DIVISÃO EXATA DOS BLOCOS ---\n`;
    blocks.forEach((b, idx) => {
      const dur = formatSecondsToMinSec(b.durationSeconds);
      const m = estimateBlockMeters(b);
      text += `${idx + 1}. [${dur} (${b.durationSeconds}s) | ~${m}m] ${b.label}\n`;
      text += `   Instrução: ${b.instruction}\n`;
    });
    if (workout.biomechanicsTip) {
      text += `\n💡 Dica Biomecânica: ${workout.biomechanicsTip}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedWorkoutId(workout.id);
    setTimeout(() => {
      setCopiedWorkoutId((prev) => (prev === workout.id ? null : prev));
    }, 2500);
  };

  // Handlers
  const handlePlanCreated = (newProfile: RunnaProfile) => {
    setProfile(newProfile);
    const newPlan = loadRunnaPlan();
    if (newPlan) {
      setPlan(newPlan);
      setSelectedWeek(1);
    }
  };

  const handleWorkoutCompleted = (
    workoutId: string,
    painScore: number,
    rpeScore: number,
    notes: string
  ) => {
    if (!plan) return;
    const updatedPlan = { ...plan };
    for (const week of updatedPlan.weeks) {
      for (const w of week.workouts) {
        if (w.id === workoutId) {
          w.completed = true;
          w.completedDate = new Date().toISOString().split('T')[0];
          w.painScorePostRun = painScore;
          w.rpeScorePostRun = rpeScore;
          w.feedbackNotes = notes;
        }
      }
    }
    setPlan(updatedPlan);
    saveRunnaPlan(updatedPlan);

    // If pain score >= 3, automatically log readiness notice
    if (painScore >= 3) {
      setIsReadinessOpen(true);
    }
  };

  const handleToggleWorkoutManual = (workoutId: string) => {
    if (!plan) return;
    const updatedPlan = { ...plan };
    for (const week of updatedPlan.weeks) {
      for (const w of week.workouts) {
        if (w.id === workoutId) {
          w.completed = !w.completed;
          w.completedDate = w.completed ? new Date().toISOString().split('T')[0] : undefined;
        }
      }
    }
    setPlan(updatedPlan);
    saveRunnaPlan(updatedPlan);
  };

  // Runna AI Counselor Quick Answers (Deterministic Clinical Evidence Engine)
  const handleSendChat = (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    const userMsg = {
      sender: 'user' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    // Clinical response logic
    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();

      if (lower.includes('dor') || lower.includes('canela') || lower.includes('joelho') || lower.includes('fáscia')) {
        reply =
          'De acordo com o protocolo de dor (Seção 6):\n• Dor 0 a 2: Seguro progredir.\n• Dor 3 a 5: Reduza o volume e ritmo do próximo treino em 30%. Não aumente a quilometragem semanal.\n• Dor > 5: Pule o treino de corrida imediatamente, faça repouso relativo ou natação/ciclismo e consulte um fisioterapeuta especializado [10, 14].';
      } else if (lower.includes('cadência') || lower.includes('passo') || lower.includes('suave')) {
        reply =
          'Para reduzir o impacto no joelho e quadril em até 20%, aumente sua cadência em 5% a 10% (buscando 170-180 passos por minuto) e aplique o comando "Correr Suave" ("run softly"), fazendo o mínimo de ruído ao tocar o solo [1, 28, 55].';
      } else if (lower.includes('10%') || lower.includes('aumento') || lower.includes('volume')) {
        reply =
          'A Regra dos 10%: Nunca aumente a quilometragem semanal em mais de 10% em relação à semana anterior. Aumentos súbitos são a principal causa de lesões por sobrecarga ("too much, too soon") [3, 8, 14].';
      } else if (lower.includes('tênis') || lower.includes('calçado') || lower.includes('rodízio')) {
        reply =
          'O rodízio de calçados (alternar 2 ou mais pares) varia as cargas e tensões repetitivas nos tendões, diminuindo o risco de lesões em corredores recreacionais em até 39% [14]. A transição para modelos minimalistas deve ser lenta e progressiva.';
      } else if (lower.includes('acwr') || lower.includes('carga') || lower.includes('perigo')) {
        reply =
          'A Razão de Carga Aguda-Crônica (ACWR) compara a carga da última semana com a média das últimas 4 semanas. A faixa ótima (Sweet Spot) é 0.8 a 1.3. Se ultrapassar 1.5, você entra na Zona de Perigo com alto risco de lesão [26, 87].';
      } else {
        reply =
          'Com base no método de corrida: priorize consistência antes de velocidade. Mantenha 80% dos seus treinos em ritmo conversacional (Zona 1/2) onde você consegue falar sem perder o ar, e reserve dias para fortalecimento de glúteos e musculatura do pé ("foot core") [17, 38].';
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'coach' as const,
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 400);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Onboarding Callout Banner if not completed */}
      {!profile?.intakeCompleted && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-yellow-500/20 border-2 border-amber-400/80 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-400 text-slate-950 font-black shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                PRIMEIRO PASSO • MONTE SUA PLANILHA RUNNA
              </span>
              <h3 className="text-base font-black text-white">
                Defina seus Dias de Treino, Objetivo e Semanas de Evolução
              </h3>
              <p className="text-xs text-slate-300">
                Escolha os dias específicos que você corre, se deseja fortalecimento complementar e em quantas semanas deseja manter o plano.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsIntakeOpen(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/30 cursor-pointer shrink-0"
          >
            Configurar Meu Plano Agora
          </button>
        </div>
      )}

      {/* RUNNA HERO BANNER */}
      <div className="relative bg-gradient-to-br from-[#07132e] via-[#091738] to-[#040916] border border-[#1a2f5c] rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Footprints className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                  MÉTODO INTEGRADO DE CORRIDA • ESTILO RUNNA
                </span>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  {plan?.name || 'Treinador de Corrida Adaptativo'}
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Metodologia científica para aprender a correr (Caminho para os 5 km), retorno seguro
              pós-lesão/parto e melhora de velocidade com treinamento polarizado 80/20, monitoramento
              de carga ACWR e sessões com intervalômetro por áudio.
            </p>
          </div>

          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setIsReadinessOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0e1d3e] border border-[#1d3870] hover:border-amber-400/60 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Check-in de Prontidão</span>
            </button>

            <button
              onClick={() => setIsStrengthModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0e1d3e] border border-[#1d3870] hover:border-amber-400/60 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Dumbbell className="w-4 h-4 text-amber-400" />
              <span>Fichas de Fortalecimento</span>
            </button>

            <button
              onClick={() => setIsIntakeOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>Ajustar Meu Plano (Dias, Semanas & Foco)</span>
            </button>
          </div>
        </div>

        {/* Status Pills Strip */}
        <div className="mt-5 pt-4 border-t border-[#14264e] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
              {profile?.goal === 'learn_to_run'
                ? '🎯 Aprender a Correr (Do Zero aos 5k)'
                : profile?.goal === 'speed_performance'
                ? '⚡ Performance & Velocidade (Polarizado)'
                : profile?.goal === 'distance_endurance'
                ? `🏃 Resistência Rumo aos ${profile.targetDistance?.toUpperCase() || '10K'}`
                : '🛡️ Retorno Seguro & Carga Ótima'}
            </span>

            <span className="px-3 py-1 rounded-full bg-[#0d1a38] border border-[#1d3466] text-slate-200 font-bold">
              📅 {profile?.selectedDays && profile.selectedDays.length > 0 ? profile.selectedDays.join(', ') : 'Seg, Qua, Sex'} ({profile?.selectedDays?.length || profile?.daysPerWeek || 3}x/sem)
            </span>

            <span className="px-3 py-1 rounded-full bg-[#0d1a38] border border-[#1d3466] text-slate-300 font-medium">
              ⏱️ Plano de {profile?.targetWeeks || plan?.totalWeeks || 10} Semanas (Semana {selectedWeek} de {profile?.targetWeeks || plan?.totalWeeks || 10})
            </span>

            <span className="px-3 py-1 rounded-full bg-[#0d1a38] border border-[#1d3466] text-amber-400 font-bold">
              {profile?.includeStrength !== false ? '🏋️ Corrida + Fortalecimento' : '🏃 Apenas Corrida'}
            </span>

            <span className="px-3 py-1 rounded-full bg-[#0d1a38] border border-[#1d3466] text-slate-300 font-medium">
              Meta: {currentWeekObj?.weeklyTargetKm || 0} km
            </span>
          </div>

          {/* Quick link to GPX telemetry */}
          {onOpenGpxAnalyzer && (
            <button
              onClick={onOpenGpxAnalyzer}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Analisar arquivo GPX gravado</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SCIENTIFIC METRICS BAR: ACWR LOAD GAUGE & 10% RULE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ACWR Gauge Card */}
        <div className="md:col-span-2 p-5 rounded-3xl bg-[#091329] border border-[#17284f] shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Razão de Carga Aguda-Crônica (ACWR) • Seção 4
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                Monitor de Risco Musculoesquelético
              </h3>
            </div>
            <span
              className={`text-xs font-black px-3 py-1 rounded-xl border ${
                acwrData.status === 'optimal'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : acwrData.status === 'low'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : acwrData.status === 'caution'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              ACWR: {acwrData.ratio} ({acwrData.label})
            </span>
          </div>

          {/* Ratio Progress visual */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-[#050a18] border border-[#16274e] rounded-full overflow-hidden flex">
              <div className="w-[30%] bg-sky-500/40" title="Sub-treinamento (< 0.8)" />
              <div className="w-[40%] bg-emerald-500 shadow-sm" title="Sweet Spot (0.8 - 1.3)" />
              <div className="w-[15%] bg-amber-500" title="Atenção (1.3 - 1.5)" />
              <div className="w-[15%] bg-rose-500" title="Zona de Perigo (> 1.5)" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.0</span>
              <span>0.8 (Sweet Spot)</span>
              <span>1.3</span>
              <span>1.5 (Perigo)</span>
              <span>2.0+</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs pt-1 border-t border-[#122144]">
            <span className="text-slate-300 leading-relaxed max-w-lg">
              {acwrData.message}
            </span>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block">Carga Aguda / Crônica:</span>
              <strong className="text-white font-mono">
                {acwrData.acuteLoad} km / {acwrData.chronicLoad} km
              </strong>
            </div>
          </div>
        </div>

        {/* 10% Rule & Readiness Quick Card */}
        <div className="p-5 rounded-3xl bg-[#091329] border border-[#17284f] shadow-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                A Regra dos 10% (Progression Rule)
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              {acwrData.tenPercentRuleViolated
                ? '⚠️ Alerta de Incremento Excessivo'
                : '✅ Progressão Aprovada'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {acwrData.tenPercentRuleViolated
                ? 'O volume planejado supera 10% da semana anterior. Considere redistribuir a carga para prevenir lesões [3, 14].'
                : 'Volume semanal dentro da margem segura de incremento sustentável (<= 10%).'}
            </p>
          </div>

          {/* Latest check-in status */}
          <div className="pt-2 border-t border-[#122144]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Último Check-in:</span>
              {latestReadiness ? (
                <span
                  className={`font-bold px-2 py-0.5 rounded-md border ${
                    latestReadiness.status === 'safe'
                      ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                      : latestReadiness.status === 'caution'
                      ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                      : 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                  }`}
                >
                  Dor {latestReadiness.painScore}/10 ({latestReadiness.status === 'safe' ? 'Seguro' : 'Atenção'})
                </span>
              ) : (
                <button
                  onClick={() => setIsReadinessOpen(true)}
                  className="text-amber-400 font-bold hover:underline"
                >
                  Realizar agora
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WEEK SELECTION CAROUSEL & PLANNER */}
      <div className="space-y-4">
        {/* DEDICATED SPACIOUS WEEK NAVIGATION */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#081226] border border-[#162952] shadow-xl space-y-3">
          {/* Top row: Week header, Direct Jump Dropdown, and Prev/Next buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-lg">
                  PROGRAMAÇÃO SEMANAL ESTRUTURADA
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  Semana {selectedWeek} de {plan?.totalWeeks || 10} ({Math.round((selectedWeek / (plan?.totalWeeks || 10)) * 100)}%)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                {currentWeekObj?.title || `Semana ${selectedWeek}`}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">{currentWeekObj?.focus}</p>
            </div>

            {/* Navigation actions: Dropdown & Stepper buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Direct Week Selector Dropdown */}
              <div className="flex items-center gap-1.5">
                <label htmlFor="week-dropdown-select" className="text-[11px] font-bold text-slate-400 hidden lg:inline">
                  Ir para:
                </label>
                <select
                  id="week-dropdown-select"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="bg-[#050a18] border border-[#1d3568] text-slate-200 text-xs font-bold px-3 py-2 rounded-xl focus:border-amber-400 outline-none cursor-pointer"
                  aria-label="Pular para semana"
                >
                  {plan?.weeks.map((w) => (
                    <option key={w.weekNumber} value={w.weekNumber} className="bg-[#091530] text-slate-200">
                      Semana {w.weekNumber}: {w.title.replace(`Semana ${w.weekNumber} - `, '')} ({w.weeklyTargetKm} km)
                    </option>
                  ))}
                </select>
              </div>

              {/* Prev Week Button */}
              <button
                type="button"
                onClick={() => setSelectedWeek((prev) => Math.max(1, prev - 1))}
                disabled={selectedWeek <= 1}
                className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-[#0d1a38] border-[#1d3870] text-slate-200 hover:text-white hover:bg-[#142854]"
                title="Semana Anterior"
              >
                <ChevronLeft className="w-4 h-4 text-amber-400" />
                <span>Anterior</span>
              </button>

              {/* Next Week Button */}
              <button
                type="button"
                onClick={() => setSelectedWeek((prev) => Math.min(plan?.totalWeeks || 10, prev + 1))}
                disabled={selectedWeek >= (plan?.totalWeeks || 10)}
                className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-[#0d1a38] border-[#1d3870] text-slate-200 hover:text-white hover:bg-[#142854]"
                title="Próxima Semana"
              >
                <span>Próxima</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Bottom row: Spacious, Smooth Carousel with Left/Right arrow controls */}
          <div className="relative flex items-center pt-2 border-t border-[#122144]">
            <button
              type="button"
              onClick={() => scrollWeeksCarousel(-260)}
              className="p-2 rounded-xl bg-[#060c1c] border border-[#172b54] text-slate-300 hover:text-amber-400 hover:bg-[#0c1836] transition-all cursor-pointer shrink-0 mr-2 z-10"
              title="Rolar semanas para esquerda"
              aria-label="Rolar semanas para esquerda"
            >
              <ChevronLeft className="w-4 h-4 text-amber-400" />
            </button>

            <div
              ref={weeksScrollRef}
              className="flex items-center gap-2 overflow-x-auto py-2 scroll-smooth scrollbar-thin scrollbar-thumb-amber-500/30 w-full"
            >
              {plan?.weeks.map((w) => {
                const isSelected = selectedWeek === w.weekNumber;
                const allDone = w.workouts.length > 0 && w.workouts.every((wk) => wk.completed);
                const isCurrent = w.weekNumber === (plan.currentWeek || 1);

                return (
                  <button
                    key={w.weekNumber}
                    id={`week-btn-${w.weekNumber}`}
                    type="button"
                    onClick={() => setSelectedWeek(w.weekNumber)}
                    className={`min-w-[110px] px-3.5 py-2.5 rounded-2xl border text-left transition-all shrink-0 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black border-amber-300 shadow-lg shadow-amber-500/25 scale-102'
                        : 'bg-[#060d1f] border-[#172b54] text-slate-300 hover:border-amber-500/40 hover:bg-[#0a1533]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-black ${isSelected ? 'text-slate-950' : 'text-white'}`}>
                        Semana {w.weekNumber}
                      </span>
                      {allDone ? (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`} />
                      ) : isCurrent ? (
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${isSelected ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'}`}>
                          Atual
                        </span>
                      ) : null}
                    </div>
                    <div className={`text-[10px] mt-1 font-mono ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                      🎯 {w.weeklyTargetKm} km
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollWeeksCarousel(260)}
              className="p-2 rounded-xl bg-[#060c1c] border border-[#172b54] text-slate-300 hover:text-amber-400 hover:bg-[#0c1836] transition-all cursor-pointer shrink-0 ml-2 z-10"
              title="Rolar semanas para direita"
              aria-label="Rolar semanas para direita"
            >
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>

        {/* WORKOUT CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentWeekObj?.workouts.map((workout) => {
            const blocks = workout.blocks || [];
            let runSec = 0;
            let walkSec = 0;
            let totalBlockMeters = 0;
            let runMeters = 0;
            let walkMeters = 0;
            let warmupCooldownMeters = 0;

            blocks.forEach((b) => {
              const m = estimateBlockMeters(b);
              totalBlockMeters += m;
              if (b.type.includes('run')) {
                runSec += b.durationSeconds;
                runMeters += m;
              } else if (b.type === 'walk') {
                walkSec += b.durationSeconds;
                walkMeters += m;
              } else {
                warmupCooldownMeters += m;
              }
            });

            const totalDurationSec = workout.estimatedMinutes * 60;
            const warmupCooldownSec = Math.max(0, totalDurationSec - runSec - walkSec);
            const isExpanded = expandedWorkoutId === workout.id;
            const displayKm = workout.estimatedDistanceKm || Number((totalBlockMeters / 1000).toFixed(1));
            const isCopied = copiedWorkoutId === workout.id;

            return (
              <div
                key={workout.id}
                className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
                  workout.completed
                    ? 'bg-[#071626]/80 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : workout.adaptedDueToPain
                    ? 'bg-[#181105]/80 border-amber-500/40'
                    : 'bg-[#091329] border-[#17284f] hover:border-amber-500/40 hover:shadow-xl'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Header row: day name, category badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-xl">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{workout.dayName}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        workout.category === 'run'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : workout.category === 'walk_run'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : workout.category === 'strength'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {workout.category === 'run'
                        ? 'Corrida Contínua'
                        : workout.category === 'walk_run'
                        ? 'Caminhada-Corrida'
                        : workout.category === 'strength'
                        ? 'Fortalecimento'
                        : 'Cross-Training'}
                    </span>
                  </div>

                  {/* Workout Title & Focus */}
                  <div>
                    <h3 className="text-base font-black text-white leading-snug">
                      {workout.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {workout.description}
                    </p>
                  </div>

                  {/* EXACT QUANTITIES BOX: SECONDS, METERS, KM */}
                  <div className="p-3.5 rounded-2xl bg-[#060c1c] border border-[#142345] space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-400 font-sans text-[11px] font-bold">Volume & Metas Exatas:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-300" title={`${totalDurationSec} segundos totais`}>
                          ⏱ {workout.estimatedMinutes} min ({totalDurationSec}s)
                        </span>
                        {totalBlockMeters > 0 && (
                          <span className="font-black text-emerald-300" title={`${totalBlockMeters} metros totais`}>
                            📍 ~{displayKm} km ({totalBlockMeters}m)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Division Breakdown Chips */}
                    {blocks.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-[#101b38] text-[10px] font-bold">
                        {runSec > 0 && (
                          <div className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center justify-between">
                            <span>🏃 Corrida:</span>
                            <span className="font-mono">{formatSecondsToMinSec(runSec)} (~{runMeters}m)</span>
                          </div>
                        )}
                        {walkSec > 0 && (
                          <div className="px-2 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/25 flex items-center justify-between">
                            <span>🚶 Caminhada:</span>
                            <span className="font-mono">{formatSecondsToMinSec(walkSec)} (~{walkMeters}m)</span>
                          </div>
                        )}
                        {warmupCooldownSec > 0 && (
                          <div className="col-span-2 px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center justify-between">
                            <span>🔥 Aquec./Desaq.:</span>
                            <span className="font-mono">{formatSecondsToMinSec(warmupCooldownSec)} (~{warmupCooldownMeters}m)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* DIRECT BLOCK-BY-BLOCK DIVISION BREAKDOWN */}
                  {blocks.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                          Divisão dos Blocos ({blocks.length} etapas):
                        </span>
                        {blocks.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setExpandedWorkoutId(isExpanded ? null : workout.id)}
                            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Recolher' : `Ver todos (${blocks.length})`}</span>
                            <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        )}
                      </div>

                      {/* Visible blocks list directly on card */}
                      <div className="space-y-1.5 p-2 rounded-xl bg-[#050a18] border border-[#14264e] max-h-56 overflow-y-auto">
                        {(isExpanded ? blocks : blocks.slice(0, 3)).map((b, idx) => {
                          const isRun = b.type.includes('run');
                          const isWalk = b.type === 'walk';
                          const blockM = estimateBlockMeters(b);
                          const dur = formatSecondsToMinSec(b.durationSeconds);

                          return (
                            <div
                              key={b.id || idx}
                              className={`p-2 rounded-lg border text-left text-[11px] space-y-0.5 transition-colors ${
                                isRun
                                  ? 'bg-[#0a1836] border-amber-500/30'
                                  : isWalk
                                  ? 'bg-[#071126] border-sky-500/25'
                                  : 'bg-[#060c1c] border-[#132348]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                                    isRun ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span className={`font-bold truncate ${isRun ? 'text-amber-300' : 'text-slate-200'}`}>
                                    {b.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 font-mono text-[10px] shrink-0">
                                  <span className="font-bold text-white bg-[#0e1d3d] px-1.5 py-0.2 rounded border border-[#1a3468]">
                                    {dur} ({b.durationSeconds}s)
                                  </span>
                                  <span className="font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                    ~{blockM}m
                                  </span>
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-tight line-clamp-1 pl-5">
                                {b.instruction}
                              </p>
                            </div>
                          );
                        })}

                        {!isExpanded && blocks.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setExpandedWorkoutId(workout.id)}
                            className="w-full text-center py-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
                          >
                            + {blocks.length - 3} blocos restantes (clique para expandir)
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Biomechanics Tip Callout */}
                  {workout.biomechanicsTip && (
                    <div className="p-2.5 rounded-xl bg-[#060c1c] border border-[#142345] text-[11px] text-slate-300 flex items-start gap-2">
                      <Footprints className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed line-clamp-2">{workout.biomechanicsTip}</span>
                    </div>
                  )}
                </div>

                {/* Workout Card Bottom Action Buttons */}
                <div className="pt-3 mt-3 border-t border-[#132347] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Check complete */}
                    <button
                      type="button"
                      onClick={() => handleToggleWorkoutManual(workout.id)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        workout.completed
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-[#060c1c] border-[#182c58] text-slate-400 hover:text-white'
                      }`}
                      title={workout.completed ? 'Marcar como não feito' : 'Marcar como concluído'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{workout.completed ? 'Feito' : 'Check'}</span>
                    </button>

                    {/* Copy workout text */}
                    {blocks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleCopyWorkout(workout)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isCopied
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-[#060c1c] border-[#182c58] text-slate-300 hover:text-white'
                        }`}
                        title="Copiar estrutura exata para notas ou Garmin"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                        <span className="hidden sm:inline">{isCopied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {/* Detail modal trigger */}
                    {blocks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDetailWorkout(workout)}
                        className="px-3 py-2 rounded-xl bg-[#0c1a38] border border-[#1b3469] text-slate-200 hover:text-white text-xs font-bold hover:bg-[#132854] transition-all cursor-pointer flex items-center gap-1.5"
                        title="Ver todos os metros, segundos, instruções e zonas de FC"
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Passo a Passo</span>
                      </button>
                    )}

                    {workout.category === 'strength' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStrengthCategory(workout.strengthRoutineId || 'foot_core');
                          setIsStrengthModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-bold hover:bg-purple-500/30 transition-all cursor-pointer"
                      >
                        <Dumbbell className="w-3.5 h-3.5 text-purple-300" />
                        <span>Ver Ficha</span>
                      </button>
                    ) : workout.blocks && workout.blocks.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setActiveGuidedWorkout(workout)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                        <span>Treino Guiado</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EVIDENCE-BASED RUNNER CONSULTANT (AI OPERATIONAL PROMPT) */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#07132e] via-[#081534] to-[#040817] border border-[#172c57] shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                PROMPT OPERACIONAL CIENTÍFICO • SEÇÃO 7
              </span>
              <h3 className="text-lg font-black text-white">
                Consultor Runna de Corrida & Biomecânica
              </h3>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            Respostas fundamentadas no relatório científico
          </span>
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            'Dor na canela (canelite): o que fazer?',
            'Como aumentar a cadência em 10%?',
            'O que é o Talk Test (ritmo conversacional)?',
            'Como funciona a regra dos 10% de volume?',
            'Por que fazer rodízio de tênis?',
          ].map((promptText) => (
            <button
              key={promptText}
              onClick={() => handleSendChat(promptText)}
              className="py-1.5 px-3 rounded-xl bg-[#091530] border border-[#16274e] text-slate-300 text-[11px] font-medium hover:border-amber-400/60 hover:text-white transition-all cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Chat message box */}
        <div className="p-4 rounded-2xl bg-[#050b1a] border border-[#121f3f] space-y-3 max-h-72 overflow-y-auto">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`p-3 rounded-2xl max-w-xl text-xs leading-relaxed whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-bold rounded-tr-none'
                    : 'bg-[#0d1c3c] text-slate-200 border border-[#1b3469] rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Chat input box */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
            placeholder="Tire dúvidas sobre dores, ritmos, respiração, calçados ou adaptações..."
            className="flex-1 bg-[#050a18] border border-[#162952] rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            onClick={() => handleSendChat()}
            className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md shadow-amber-500/20"
            title="Enviar Pergunta"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Intake Questionnaire Modal */}
      <RunnaIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onPlanCreated={handlePlanCreated}
        initialProfile={profile}
      />

      {/* 2. Readiness & Pain Check-in Modal */}
      <RunnaReadinessModal
        isOpen={isReadinessOpen}
        onClose={() => setIsReadinessOpen(false)}
        onCheckinComplete={(checkin) => {
          setReadinessLogs((prev) => [checkin, ...prev]);
        }}
        activePlan={plan}
        onPlanUpdated={(newPlan) => setPlan(newPlan)}
      />

      {/* 3. Live Guided Interval Session Modal */}
      {activeGuidedWorkout && (
        <RunnaGuidedSessionModal
          workout={activeGuidedWorkout}
          isOpen={!!activeGuidedWorkout}
          onClose={() => setActiveGuidedWorkout(null)}
          onWorkoutCompleted={handleWorkoutCompleted}
        />
      )}

      {/* 4. Strength Routines Modal */}
      <RunnaStrengthModal
        isOpen={isStrengthModalOpen}
        onClose={() => setIsStrengthModalOpen(false)}
        selectedCategory={selectedStrengthCategory}
        onCompleteRoutine={() => {
          // Mark today's strength session done if available
          if (plan) {
            const updated = { ...plan };
            const currWk = updated.weeks.find((w) => w.weekNumber === selectedWeek);
            const strWorkout = currWk?.workouts.find((w) => w.category === 'strength' && !w.completed);
            if (strWorkout) {
              strWorkout.completed = true;
              strWorkout.completedDate = new Date().toISOString().split('T')[0];
              setPlan(updated);
              saveRunnaPlan(updated);
            }
          }
        }}
      />

      {/* 5. Workout Detail & Block Breakdown Modal */}
      {selectedDetailWorkout && (
        <RunnaWorkoutDetailModal
          workout={selectedDetailWorkout}
          isOpen={!!selectedDetailWorkout}
          onClose={() => setSelectedDetailWorkout(null)}
          onStartGuided={(w) => {
            setSelectedDetailWorkout(null);
            setActiveGuidedWorkout(w);
          }}
        />
      )}
    </div>
  );
};
