import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  X,
  Activity,
  Calendar,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Footprints,
  Dumbbell,
  Clock,
  ShieldAlert,
  Flame,
  Info,
} from 'lucide-react';
import {
  RunnaProfile,
  RunnerLevel,
  RunnerGoal,
  RunnerTargetDistance,
  ReturnContext,
  DayOfWeek,
} from '../types/runna';
import { generateRunnaPlan } from '../utils/runnaPlanGenerator';
import { saveRunnaPlan, saveRunnaProfile } from '../utils/storage';

interface RunnaIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: (profile: RunnaProfile) => void;
  initialProfile?: RunnaProfile | null;
}

const ALL_WEEK_DAYS: { id: DayOfWeek; short: string; label: string }[] = [
  { id: 'Segunda', short: 'SEG', label: 'Segunda-feira' },
  { id: 'Terça', short: 'TER', label: 'Terça-feira' },
  { id: 'Quarta', short: 'QUA', label: 'Quarta-feira' },
  { id: 'Quinta', short: 'QUI', label: 'Quinta-feira' },
  { id: 'Sexta', short: 'SEX', label: 'Sexta-feira' },
  { id: 'Sábado', short: 'SÁB', label: 'Sábado' },
  { id: 'Domingo', short: 'DOM', label: 'Domingo' },
];

export const RunnaIntakeModal: React.FC<RunnaIntakeModalProps> = ({
  isOpen,
  onClose,
  onPlanCreated,
  initialProfile,
}) => {
  const [step, setStep] = useState<number>(1);

  // 1. Goal & Target Distance
  const [goal, setGoal] = useState<RunnerGoal>(initialProfile?.goal || 'learn_to_run');
  const [targetDistance, setTargetDistance] = useState<RunnerTargetDistance>(
    initialProfile?.targetDistance || '5k'
  );
  const [returnContext, setReturnContext] = useState<ReturnContext>(
    initialProfile?.returnContext || 'injury'
  );

  // 2. Selected Days of Week (e.g. ['Segunda', 'Quarta', 'Sexta'])
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    initialProfile?.selectedDays && initialProfile.selectedDays.length > 0
      ? initialProfile.selectedDays
      : ['Segunda', 'Quarta', 'Sexta']
  );

  // 3. Include Strength Exercises or Running Only
  const [includeStrength, setIncludeStrength] = useState<boolean>(
    initialProfile?.includeStrength !== undefined ? initialProfile.includeStrength : true
  );

  // 4. Target Weeks (Duration based on science)
  const [targetWeeks, setTargetWeeks] = useState<number>(
    initialProfile?.targetWeeks || 10
  );

  // 5. Conditioning Level & Injuries
  const [level, setLevel] = useState<RunnerLevel>(initialProfile?.level || 'inactive');
  const [injuries, setInjuries] = useState<string[]>(
    initialProfile?.injuriesLast12Months || ['none']
  );

  if (!isOpen) return null;

  // Toggle day selection
  const handleToggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      // Order days naturally
      const order = ALL_WEEK_DAYS.map((d) => d.id);
      const next = [...selectedDays, day].sort((a, b) => order.indexOf(a) - order.indexOf(b));
      setSelectedDays(next);
    }
  };

  // Toggle injury selection
  const handleToggleInjury = (id: string) => {
    if (id === 'none') {
      setInjuries(['none']);
      return;
    }
    const filtered = injuries.filter((item) => item !== 'none');
    if (filtered.includes(id)) {
      const remaining = filtered.filter((item) => item !== id);
      setInjuries(remaining.length > 0 ? remaining : ['none']);
    } else {
      setInjuries([...filtered, id]);
    }
  };

  // Preset week options based on chosen goal (Scientific Evidence [3, 8, 20, 27, 40])
  const getWeekOptionsForGoal = () => {
    if (goal === 'learn_to_run') {
      return [
        {
          weeks: 4,
          label: '4 Semanas (Pré-Condicionamento)',
          desc: 'Caminhadas + saltitos para preparar tendões e densidade óssea [14, 15].',
        },
        {
          weeks: 8,
          label: '8 Semanas (Transição Acelerada)',
          desc: 'Para quem já tem base física e quer atingir os 5k com segurança.',
        },
        {
          weeks: 10,
          label: '10 Semanas (Recomendado pela Ciência)',
          desc: 'O período padrão ideal (9 a 13 semanas) de transição caminhada-corrida [8, 20].',
          badge: 'Recomendado',
        },
        {
          weeks: 12,
          label: '12 Semanas (Gradual e Suave)',
          desc: 'Ritmo muito tranquilo com menor taxa de impacto articular.',
        },
      ];
    } else if (goal === 'speed_performance') {
      return [
        {
          weeks: 6,
          label: '6 Semanas (Ciclo Curto de VAM)',
          desc: 'Foco intenso em velocidade e tiros intervalados a 95-110% MAS [17].',
        },
        {
          weeks: 8,
          label: '8 Semanas (Modelo Polarizado 80/20)',
          desc: 'Duração padrão para máxima adaptação aeróbica e economia de corrida [27, 40].',
          badge: 'Recomendado',
        },
        {
          weeks: 12,
          label: '12 Semanas (Ciclo Completo com Deload)',
          desc: 'Evolução contínua com semanas de alívio e teste de ritmo de prova.',
        },
      ];
    } else if (goal === 'distance_endurance') {
      return [
        {
          weeks: 8,
          label: '8 Semanas (Foco 10 km)',
          desc: 'Construção consistente com acréscimo sustentável de volume [3].',
        },
        {
          weeks: 12,
          label: '12 Semanas (Meia-Maratona 21k)',
          desc: 'Construção adequada de resistência conforme literatura científica [8].',
          badge: 'Ideal 21k',
        },
        {
          weeks: 16,
          label: '16 Semanas (Maratona 42k ou 21k Avançado)',
          desc: 'Ciclo completo com longões periódicos e controle estrito de ACWR [13, 36].',
          badge: 'Ideal 42k',
        },
        {
          weeks: 24,
          label: '24 Semanas (Ciclo Longo e Gradual)',
          desc: 'Para quem quer correr provas longas com máxima segurança articular.',
        },
      ];
    } else {
      // return_safe
      return [
        {
          weeks: 4,
          label: '4 Semanas (Transição Inicial)',
          desc: 'Trote suave e reintrodução sem dor nas atividades diárias [1].',
        },
        {
          weeks: 8,
          label: '8 Semanas (Carga Ótima Completa)',
          desc: 'Protocolo completo pós-lesão ou pós-parto com monitoramento de dor [22, 103].',
          badge: 'Recomendado',
        },
        {
          weeks: 12,
          label: '12 Semanas (Reabilitação Prolongada)',
          desc: 'Evolução ultraconservadora com foco contínuo em core e assoalho pélvico.',
        },
      ];
    }
  };

  const handleFinish = () => {
    const profile: RunnaProfile = {
      intakeCompleted: true,
      level,
      goal,
      targetDistance,
      returnContext: goal === 'return_safe' ? returnContext : undefined,
      daysPerWeek: selectedDays.length,
      selectedDays,
      includeStrength,
      targetWeeks,
      injuriesLast12Months: injuries,
      currentTalkTestComfort: 'conversational',
      currentWeek: 1,
      preferredCadence: 172,
      usesShoeRotation: false,
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newPlan = generateRunnaPlan(profile);
    saveRunnaProfile(profile);
    saveRunnaPlan(newPlan);
    onPlanCreated(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#091530] via-[#060e22] to-[#040815] border border-[#1d3363] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Glow Header */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar */}
        <div className="p-5 sm:p-6 border-b border-[#142344] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400">
              <Footprints className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                CONFIGURAÇÃO DO SEU PLANO RUNNA
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {step === 1 && '1. Escolha o Seu Objetivo'}
                {step === 2 && '2. Escolha os Dias da Semana'}
                {step === 3 && '3. Fortalecimento ou Apenas Corrida?'}
                {step === 4 && '4. Duração do Plano em Semanas'}
                {step === 5 && '5. Nível Atual & Histórico'}
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

        {/* Step Indicator */}
        <div className="px-6 pt-3 pb-1 flex items-center justify-between text-xs text-slate-400 border-b border-[#101c38]">
          <span className="font-bold text-amber-400">Passo {step} de 5</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? 'w-6 bg-amber-400'
                    : i < step
                    ? 'w-3 bg-emerald-400'
                    : 'w-3 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* STEP 1: Main Goal */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  O que você deseja alcançar na corrida?
                </h3>
                <p className="text-xs text-slate-300">
                  Selecione seu foco principal. O algoritmo adaptativo ajustará a intensidade e os intervalos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  {
                    id: 'learn_to_run',
                    title: 'Aprender a Correr (Do Zero aos 5 km)',
                    desc: 'Ideal para quem nunca correu ou quer correr 5 km sem caminhar e sem perder o fôlego [13, 20].',
                    tag: 'Walk-Run & Talk Test',
                  },
                  {
                    id: 'speed_performance',
                    title: 'Correr Mais Rápido (Performance & Pace)',
                    desc: 'Foco em ritmo, economia de corrida, VAM/MAS e treinamento polarizado 80/20 [27, 40].',
                    tag: 'Intervalados & VAM',
                  },
                  {
                    id: 'distance_endurance',
                    title: 'Correr Mais Longe (Resistência & Provas)',
                    desc: 'Progressão segura de volume para 10 km, Meia-Maratona (21k) ou Maratona com a Regra dos 10% [8, 36].',
                    tag: 'Volume Sustentável',
                  },
                  {
                    id: 'return_safe',
                    title: 'Voltar a Correr com Segurança (Reabilitação)',
                    desc: 'Retorno seguro após lesão ou período pós-parto, com controle de dor e carga ótima [22, 103].',
                    tag: 'Carga Ótima & Dor 0-10',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setGoal(item.id as RunnerGoal);
                      // set default recommended weeks for goal
                      if (item.id === 'learn_to_run') setTargetWeeks(10);
                      if (item.id === 'speed_performance') setTargetWeeks(8);
                      if (item.id === 'distance_endurance') setTargetWeeks(12);
                      if (item.id === 'return_safe') setTargetWeeks(8);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      goal === item.id
                        ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-[#071126] border-[#14264e] hover:border-amber-500/40 hover:bg-[#0b1735]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{item.title}</span>
                        {goal === item.id && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-400 w-fit">
                      {item.tag}
                    </span>
                  </button>
                ))}
              </div>

              {/* Sub-selector if endurance */}
              {goal === 'distance_endurance' && (
                <div className="p-4 rounded-2xl bg-[#091530] border border-[#16274e] space-y-2 mt-2">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    Distância Alvo:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['10k', '21k', '42k'] as RunnerTargetDistance[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setTargetDistance(d);
                          if (d === '10k') setTargetWeeks(8);
                          if (d === '21k') setTargetWeeks(12);
                          if (d === '42k') setTargetWeeks(16);
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          targetDistance === d
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                            : 'bg-[#060c1c] text-slate-300 border-[#1a2e58] hover:border-amber-500/50'
                        }`}
                      >
                        {d === '21k' ? 'Meia-Maratona (21k)' : d === '42k' ? 'Maratona (42k)' : '10 km'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-selector if return_safe */}
              {goal === 'return_safe' && (
                <div className="p-4 rounded-2xl bg-[#091530] border border-[#16274e] space-y-2 mt-2">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    Contexto de Retorno:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'injury', label: 'Pós-Lesão' },
                      { id: 'post_partum', label: 'Pós-Parto (Assoalho Pélvico)' },
                      { id: 'long_break', label: 'Pausa Longa' },
                    ].map((rc) => (
                      <button
                        key={rc.id}
                        type="button"
                        onClick={() => setReturnContext(rc.id as ReturnContext)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          returnContext === rc.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                            : 'bg-[#060c1c] text-slate-300 border-[#1a2e58] hover:border-amber-500/50'
                        }`}
                      >
                        {rc.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Selected Days of Week */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Quais dias da semana você vai correr?
                </h3>
                <p className="text-xs text-slate-300">
                  Clique nos dias exatos em que você prefere treinar. Seus treinos serão distribuídos exatamente nesses dias!
                </p>
              </div>

              {/* Day selection buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {ALL_WEEK_DAYS.map((d) => {
                  const isSelected = selectedDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleToggleDay(d.id)}
                      className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-gradient-to-br from-amber-500/25 to-yellow-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                          : 'bg-[#071126] border-[#14264e] text-slate-400 hover:border-amber-500/40 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-black tracking-wider text-amber-400">
                          {d.short}
                        </span>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-600" />
                        )}
                      </div>
                      <span className="text-xs font-bold mt-0.5">{d.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected frequency summary */}
              <div className="p-4 rounded-2xl bg-[#091530] border border-[#16274e] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Frequência Semanal Escolhida:</span>
                  <span className="text-sm font-black text-amber-300">
                    {selectedDays.length} {selectedDays.length === 1 ? 'dia' : 'dias'} por semana
                  </span>
                </div>
                <div className="text-right text-slate-300">
                  <span className="text-[11px] text-slate-400 block">Dias marcados:</span>
                  <span className="font-bold text-white">
                    {selectedDays.join(', ')}
                  </span>
                </div>
              </div>

              {/* Scientific note */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300">Evidência Científica [6, 18]: </span>
                  Para corredores recreacionais, 3 a 4 sessões semanais em dias alternados oferecem
                  o equilíbrio ótimo entre síntese de colágeno nos tendões e descanso tecidual.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Strength vs Running Only */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Deseja incluir exercícios de fortalecimento?
                </h3>
                <p className="text-xs text-slate-300">
                  Escolha se sua planilha terá sessões complementares de força nos dias de descanso ou se focará apenas em corrida.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIncludeStrength(true)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    includeStrength
                      ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                      : 'bg-[#071126] border-[#14264e] hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-amber-400" />
                        <span className="font-black text-white text-sm">
                          Corrida + Fortalecimento
                        </span>
                      </div>
                      {includeStrength && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Adiciona 2 sessões semanais leves com o peso do corpo nos dias de descanso
                      focadas em glúteos (prevenção de queda pélvica), panturrilhas e musculatura do pé (&quot;foot core&quot;).
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 w-fit">
                    Altamente Recomendado pela Ciência [11, 38]
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeStrength(false)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    !includeStrength
                      ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                      : 'bg-[#071126] border-[#14264e] hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Footprints className="w-5 h-5 text-amber-400" />
                        <span className="font-black text-white text-sm">
                          Apenas Treinos de Corrida
                        </span>
                      </div>
                      {!includeStrength && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sua planilha conterá exclusivamente as sessões de corrida e caminhada nos dias que você escolheu.
                      Você ainda poderá consultar as fichas de exercícios quando quiser.
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-slate-600 bg-slate-800 text-slate-300 w-fit">
                    Foco 100% Corrida
                  </span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200/90 leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300">Por que fortalecimento? </span>
                  O treinamento de força complementar é a intervenção não relacionada à corrida mais
                  eficaz para diminuir o risco de lesões comuns, como fascite plantar e dores patelofemorais no joelho [11].
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Duration in Weeks based on science */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Por quantas semanas você manterá este plano?
                </h3>
                <p className="text-xs text-slate-300">
                  Durações fundamentadas nos artigos científicos de periodização e adaptação fisiológica.
                </p>
              </div>

              {/* Week Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {getWeekOptionsForGoal().map((opt) => (
                  <button
                    key={opt.weeks}
                    type="button"
                    onClick={() => setTargetWeeks(opt.weeks)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      targetWeeks === opt.weeks
                        ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-[#071126] border-[#14264e] hover:border-amber-500/40 hover:bg-[#0b1735]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{opt.label}</span>
                        {targetWeeks === opt.weeks && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
                    </div>
                    {opt.badge && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/15 text-amber-300 w-fit">
                        {opt.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Week Selector Slider */}
              <div className="p-4 rounded-2xl bg-[#091530] border border-[#16274e] space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Ou ajuste livremente o número de semanas:
                  </span>
                  <span className="text-base font-black text-white font-mono bg-[#060c1c] px-3 py-0.5 rounded-lg border border-[#1e3260]">
                    {targetWeeks} Semanas
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="24"
                  step="1"
                  value={targetWeeks}
                  onChange={(e) => setTargetWeeks(Number(e.target.value))}
                  className="w-full accent-amber-400 h-2 bg-[#060c1c] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>4 semanas</span>
                  <span>8 semanas</span>
                  <span>12 semanas</span>
                  <span>16 semanas</span>
                  <span>24 semanas</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Conditioning Level & Medical History */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Seu Nível Atual & Histórico de Lesões
                </h3>
                <p className="text-xs text-slate-300">
                  Últimos ajustes para garantir a segurança da progressão de carga (Regra dos 10%).
                </p>
              </div>

              {/* Conditioning level */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  Como você se classifica hoje?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'inactive', label: 'Sedentário', sub: 'Inativo há meses' },
                    { id: 'sporadic', label: 'Esporádico', sub: 'Corre às vezes' },
                    { id: 'regular', label: 'Regular', sub: 'Treina toda semana' },
                    { id: 'rehab', label: 'Em Retorno', sub: 'Pós-pausa/lesão' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLevel(item.id as RunnerLevel)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        level === item.id
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow'
                          : 'bg-[#071126] text-slate-300 border-[#14264e] hover:border-amber-500/40'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] opacity-75">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Injury history */}
              <div className="space-y-2 pt-2 border-t border-[#132347]">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  Lesões nos últimos 12 meses (selecione se houver):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'Nenhuma Lesão' },
                    { id: 'joelho', label: 'Joelho (Patelofemoral / TBI)' },
                    { id: 'canelite', label: 'Canelite (Estresse Tibial)' },
                    { id: 'fascia_plantar', label: 'Fáscia Plantar / Pé' },
                    { id: 'tendao_aquiles', label: 'Tendão de Aquiles' },
                    { id: 'quadril_lombar', label: 'Quadril ou Lombar' },
                  ].map((inj) => {
                    const isChecked =
                      inj.id === 'none'
                        ? injuries.length === 0 || injuries.includes('none')
                        : injuries.includes(inj.id);
                    return (
                      <button
                        key={inj.id}
                        type="button"
                        onClick={() => handleToggleInjury(inj.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                          isChecked
                            ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                            : 'bg-[#071126] border-[#14264e] text-slate-400'
                        }`}
                      >
                        <span className="truncate">{inj.label}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Final Plan Summary Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/40 space-y-1.5 text-xs text-emerald-200">
                <span className="font-bold text-emerald-300 uppercase tracking-wider block">
                  Resumo da Sua Nova Planilha Runna:
                </span>
                <p>
                  • <strong>Objetivo:</strong> {goal === 'learn_to_run' ? 'Aprender a Correr (5 km)' : goal === 'speed_performance' ? 'Performance 80/20' : goal === 'distance_endurance' ? `Resistência ${targetDistance}` : 'Retorno Seguro'}<br />
                  • <strong>Dias de Treino:</strong> {selectedDays.join(', ')} ({selectedDays.length}x/semana)<br />
                  • <strong>Duração Total:</strong> {targetWeeks} semanas de evolução contínua<br />
                  • <strong>Formato:</strong> {includeStrength ? 'Corrida + Fortalecimento Complementar' : 'Apenas Treinos de Corrida'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Buttons */}
        <div className="p-5 sm:p-6 border-t border-[#142344] bg-[#050b1c] flex items-center justify-between gap-3 relative z-10">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0c1836] border border-[#192b56] text-xs font-bold text-slate-300 hover:text-white hover:bg-[#132450] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <span>Próximo Passo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-black text-xs sm:text-sm hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
            >
              <Sparkles className="w-4 h-4" />
              <span>Criar Minha Planilha Runna Personalizada</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
