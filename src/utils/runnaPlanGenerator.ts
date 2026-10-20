import {
  RunnaPlan,
  RunnaProfile,
  RunnaWorkout,
  WorkoutBlock,
  StrengthExerciseItem,
  ACWRStatus,
} from '../types/runna';

/**
 * Scientific Exercise Library for Runners
 * Based on Section 5.1 of the scientific method:
 * Foot core (intrinsic muscles), Glutes/pelvis, Calves/Achilles, Quads, Core & Pelvic floor.
 */
export const STRENGTH_EXERCISES_CATALOG: StrengthExerciseItem[] = [
  {
    id: 'foot_core_towel',
    name: 'Toalha com os Dedos & Short Foot (Foot Core)',
    category: 'foot_core',
    targetMuscles: 'Musculatura intrínseca plantar, flexor curto dos dedos',
    clinicalBenefit:
      'Fortalece o arco longitudinal medial do pé e previne fascite plantar e colapso do arco sob carga de impacto [38, 106].',
    setsReps: '3 séries de 15 puxadas ou 10 contrações de 5 segundos',
    instructions: [
      'Sente-se com o pé descalço apoiado sobre uma toalha estendida no chão.',
      'Use exclusivamente os dedos do pé para enrugar e puxar a toalha em sua direção.',
      'Em seguida, pratique o "pé curto" (short foot): eleve o arco do pé aproximando a cabeça do primeiro metatarso do calcanhar, sem enrolar as pontas dos dedos.',
    ],
    keyCue: 'Mantenha os dedos relaxados no chão enquanto puxa o arco para cima.',
    citationRef: 'Fourchet et al. [38], McKeon et al. [106]',
  },
  {
    id: 'glute_clamshell_lateral',
    name: 'Clamshell & Abdução Lateral de Quadril',
    category: 'glutes_pelvis',
    targetMuscles: 'Glúteo médio, rotadores externos do quadril',
    clinicalBenefit:
      'Estabiliza a pelve durante a fase de apoio unilateral da corrida, evitando a queda pélvica contralateral (Sinal de Trendelenburg) e o valgo dinâmico de joelho [1, 10].',
    setsReps: '3 séries de 15 a 20 repetições por lado',
    instructions: [
      'Deite-se de lado com os joelhos flexionados a 90 graus e calcanhares juntos.',
      'Abra o joelho de cima sem girar o tronco ou a pelve para trás.',
      'Segure 1 segundo no topo com contração máxima do glúteo e desça lentamente.',
    ],
    keyCue: 'Não deixe o quadril rodar para trás; sinta a lateral do bumbum queimar.',
    citationRef: 'Almeida et al. [1], Powers et al. [111]',
  },
  {
    id: 'calf_eccentric_raise',
    name: 'Elevação Panturrilha Excêntrica no Degrau',
    category: 'calves_achilles',
    targetMuscles: 'Gastrocnêmio, sóleo e tendão calcâneo (Aquiles)',
    clinicalBenefit:
      'Aumenta a rigidez do tendão de Aquiles, previne tendinopatias e melhora a eficiência de propulsão na passada [14, 15].',
    setsReps: '3 séries de 12 repetições lentas por perna',
    instructions: [
      'Apoie a ponta dos pés na borda de um degrau, calcanhares suspensos.',
      'Suba com os dois pés e desça controladamente com apenas uma perna em 3 a 4 segundos abaixo da linha do degrau.',
      'Alongue suavemente a fáscia e o tendão no fundo e repita.',
    ],
    keyCue: 'Descida lenta de 3 a 4 segundos; sinta a tensão controlada no tendão.',
    citationRef: 'Bredeweg et al. [14], Buist et al. [15]',
  },
  {
    id: 'quad_wall_sit_split_squat',
    name: 'Agachamento Isométrico na Parede (Wall Sit) & Afundo',
    category: 'quads_knees',
    targetMuscles: 'Quadríceps femoral (vasto medial e reto femoral)',
    clinicalBenefit:
      'Reduz a sobrecarga patelofemoral e absorve as forças de frenagem no impacto inicial da corrida [55, 106].',
    setsReps: '3 séries de 45 segundos isometria na parede + 10 afundos por perna',
    instructions: [
      'Apoie as costas retas na parede e deslize até os joelhos ficarem a 90 graus.',
      'Mantenha as coxas paralelas ao solo e respire normalmente.',
      'Em seguida, faça afundos controlados com o tronco levemente inclinado para frente.',
    ],
    keyCue: 'Joelhos alinhados com o segundo dedo do pé, sem deixar convergir para dentro.',
    citationRef: 'Crowell & Davis [28], Milner et al. [106]',
  },
  {
    id: 'core_pelvic_bridge',
    name: 'Ponte de Glúteos Unilateral & Ativação Pélvica',
    category: 'core_pelvic_floor',
    targetMuscles: 'Glúteo máximo, eretores da espinha, transverso do abdômen e assoalho pélvico',
    clinicalBenefit:
      'Garante rigidez lumbo-pélvica e previne lombalgias. Fundamental no retorno pós-parto para suporte dos órgãos pélvicos e controle de incontinência por impacto [22, 33, 127].',
    setsReps: '3 séries de 10 repetições com pausa de 3s no topo por perna',
    instructions: [
      'Deite-se de barriga para cima com joelhos dobrados e pés firmes no chão.',
      'Ative suavemente o assoalho pélvico (como se estivesse segurando a urina) e o abdômen.',
      'Eleve o quadril até alinhar joelhos, pelve e ombros. Para progressão, estenda uma perna sem deixar a pelve tombar.',
    ],
    keyCue: 'Mantenha a bacia rigorosamente nivelada no topo, sem oscilação.',
    citationRef: 'Christopher et al. [22], Donnelly et al. [33]',
  },
];

const DAY_ORDER: Record<string, number> = {
  Segunda: 1,
  Terça: 2,
  Quarta: 3,
  Quinta: 4,
  Sexta: 5,
  Sábado: 6,
  Domingo: 7,
};

const ALL_DAYS: ('Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo')[] = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];

/**
 * Generate customized evidence-based Runna plan according to intake profile
 */
export function generateRunnaPlan(profile: RunnaProfile): RunnaPlan {
  const { goal, level, returnContext, targetWeeks, selectedDays = ['Segunda', 'Quarta', 'Sexta'], includeStrength = true } = profile;

  // Total weeks chosen by user or evidence-based defaults
  let totalWeeks = targetWeeks;
  if (!totalWeeks || totalWeeks < 4) {
    if (goal === 'learn_to_run') {
      totalWeeks = level === 'inactive' ? 12 : 9;
    } else if (goal === 'speed_performance') {
      totalWeeks = 8;
    } else if (goal === 'distance_endurance') {
      totalWeeks = profile.targetDistance === '21k' ? 12 : profile.targetDistance === '42k' ? 16 : 8;
    } else if (goal === 'return_safe') {
      totalWeeks = 8;
    } else {
      totalWeeks = 8;
    }
  }

  // Ensure valid selected days
  const runningDays = (selectedDays && selectedDays.length > 0)
    ? selectedDays
    : ['Segunda', 'Quarta', 'Sexta'];

  // Identify off-days for strength if user wants strength included
  const nonRunningDays = ALL_DAYS.filter((d) => !runningDays.includes(d));
  const strengthDay1 = nonRunningDays[0] || runningDays[1] || 'Terça';
  const strengthDay2 = nonRunningDays[1] || nonRunningDays[0] || runningDays[3] || 'Quinta';

  const weeks: RunnaPlan['weeks'] = [];

  for (let w = 1; w <= totalWeeks; w++) {
    const isPreconditioning = goal === 'learn_to_run' && level === 'inactive' && w <= 4;
    const isPostPartumOrRehab = goal === 'return_safe';

    let weekTitle = `Semana ${w}`;
    let weekFocus = '';
    let weeklyTargetKm = 0;
    const workouts: RunnaWorkout[] = [];

    if (isPreconditioning) {
      weekTitle = `Semana ${w} - Pré-Condicionamento Estrutural`;
      weekFocus =
        'Caminhada acelerada + Saltitos suaves (Hopping) para adaptação óssea e tendínea [14, 15]';
      weeklyTargetKm = 6 + w * 1.5;

      // Assign preconditioning walks to runningDays
      runningDays.forEach((dayName, idx) => {
        const isLonger = idx === runningDays.length - 1;
        const durationMin = (30 + w * 5) + (isLonger ? 10 : 0);
        const distKm = Math.round((2.5 + w * 0.5 + (isLonger ? 1.0 : 0)) * 10) / 10;
        workouts.push(createPreconditioningWorkout(w, idx + 1, dayName, durationMin, distKm));
      });

      // Optional complementary strength if enabled
      if (includeStrength) {
        workouts.push(createStrengthWorkout(w, 10, strengthDay1, 'foot_core'));
        if (runningDays.length <= 4) {
          workouts.push(createStrengthWorkout(w, 11, strengthDay2, 'calves_achilles'));
        }
      }
    } else if (goal === 'learn_to_run') {
      const activeWeek = level === 'inactive' ? Math.max(1, w - 4) : w;
      weekTitle = `Semana ${w} - Método Caminhada-Corrida Progressivo`;
      weekFocus = getBeginnerWeekFocus(activeWeek);
      weeklyTargetKm = Math.round((7 + activeWeek * 1.3) * 10) / 10;

      // Assign walk-runs to runningDays
      runningDays.forEach((dayName, idx) => {
        const isLonger = idx === runningDays.length - 1;
        workouts.push(createWalkRunWorkout(w, idx + 1, dayName, activeWeek, isLonger));
      });

      // Optional complementary strength if enabled
      if (includeStrength) {
        workouts.push(createStrengthWorkout(w, 10, strengthDay1, 'glutes_pelvis'));
        if (runningDays.length <= 4) {
          workouts.push(createStrengthWorkout(w, 11, strengthDay2, 'foot_core'));
        }
      }
    } else if (goal === 'speed_performance') {
      weekTitle = `Semana ${w} - Treinamento Polarizado 80/20 & MAS`;
      weekFocus =
        w % 4 === 0
          ? 'Semana Regenerativa (Deload) & Teste de Economia de Corrida'
          : '80% Volume Z1/Z2 Fácil + 20% Intervalado a 95-110% MAS [27, 40]';
      weeklyTargetKm = Math.round((18 + w * 1.8) * 10) / 10;

      // Assign specific polarized types to user days:
      // Day 1: Easy Aerobic (Z1/Z2)
      // Day 2: Interval Session (95-110% MAS)
      // Day 3: Continuous Running Economy (70-75% MAS) or Long Run
      // Day 4+: Long easy run or recovery
      runningDays.forEach((dayName, idx) => {
        if (idx === 0) {
          workouts.push(createPolarizedEasyWorkout(w, 1, dayName, 35, 5.5));
        } else if (idx === 1) {
          workouts.push(createIntervalMasWorkout(w, 2, dayName, w));
        } else if (idx === 2) {
          workouts.push(createEconomyRunWorkout(w, 3, dayName, 40, 6.5));
        } else {
          workouts.push(createLongRunWorkout(w, idx + 1, dayName, Math.min(14, 8 + w * 0.8)));
        }
      });

      if (includeStrength) {
        workouts.push(createStrengthWorkout(w, 10, strengthDay1, 'glutes_pelvis'));
      }
    } else if (goal === 'distance_endurance') {
      weekTitle = `Semana ${w} - Construção de Resistência & Regra dos 10%`;
      weekFocus =
        w % 4 === 0
          ? 'Semana de Recuperação e Consolidação Musculoesquelética'
          : `Progressão Gradual de Volume Semanal (<= 10%) rumo aos ${profile.targetDistance}`;
      weeklyTargetKm = Math.round((15 + w * 2.2) * 10) / 10;

      runningDays.forEach((dayName, idx) => {
        const isLongest = idx === runningDays.length - 1;
        if (isLongest) {
          workouts.push(
            createLongRunWorkout(
              w,
              idx + 1,
              dayName,
              Math.min(26, 9 + w * (profile.targetDistance === '21k' ? 1.2 : profile.targetDistance === '42k' ? 1.8 : 0.8))
            )
          );
        } else if (idx === 0) {
          workouts.push(createPolarizedEasyWorkout(w, 1, dayName, 40, 6));
        } else if (idx === 1) {
          workouts.push(createEconomyRunWorkout(w, 2, dayName, 45, 7));
        } else {
          workouts.push(createPolarizedEasyWorkout(w, idx + 1, dayName, 45, 6.5));
        }
      });

      if (includeStrength) {
        workouts.push(createStrengthWorkout(w, 10, strengthDay1, 'quads_knees'));
        if (runningDays.length <= 4) {
          workouts.push(createStrengthWorkout(w, 11, strengthDay2, 'foot_core'));
        }
      }
    } else {
      // return_safe (Rehab or post partum)
      weekTitle = `Semana ${w} - Retorno Seguro & Carga Ótima`;
      weekFocus =
        returnContext === 'post_partum'
          ? 'Recondicionamento do Assoalho Pélvico, Core & Caminhada-Corrida Suave [22, 127]'
          : 'Transição Pós-Lesão com Repouso Relativo e Monitoramento de Dor 0-10 [1, 103]';
      weeklyTargetKm = Math.round((5 + w * 1.0) * 10) / 10;

      runningDays.forEach((dayName, idx) => {
        const isWeekend = idx === runningDays.length - 1;
        workouts.push(createRehabWalkRunWorkout(w, idx + 1, dayName, w, returnContext, isWeekend));
      });

      if (includeStrength) {
        workouts.push(
          createStrengthWorkout(
            w,
            10,
            strengthDay1,
            returnContext === 'post_partum' ? 'core_pelvic_floor' : 'calves_achilles'
          )
        );
        workouts.push(createStrengthWorkout(w, 11, strengthDay2, 'glutes_pelvis'));
      }
    }

    // Sort workouts strictly by day of week (Segunda -> Domingo)
    workouts.sort((a, b) => (DAY_ORDER[a.dayName] || 99) - (DAY_ORDER[b.dayName] || 99));

    weeks.push({
      weekNumber: w,
      title: weekTitle,
      focus: weekFocus,
      weeklyTargetKm,
      workouts,
    });
  }

  return {
    id: `runna_plan_${Date.now()}`,
    name: getPlanName(profile),
    goal,
    level,
    totalWeeks,
    currentWeek: 1,
    weeks,
    generatedAt: new Date().toISOString(),
  };
}

function getPlanName(profile: RunnaProfile): string {
  switch (profile.goal) {
    case 'learn_to_run':
      return 'Método Iniciante: Do Zero aos 5 km Sem Dor';
    case 'speed_performance':
      return 'Performance & Velocidade: Polarizado 80/20 & MAS';
    case 'distance_endurance':
      return `Resistência & Volume Sustentável: Rumo aos ${profile.targetDistance.toUpperCase()}`;
    case 'return_safe':
      return profile.returnContext === 'post_partum'
        ? 'Retorno Seguro Pós-Parto: Assoalho Pélvico & Corrida Suave'
        : 'Reabilitação & Retorno Pós-Lesão: Carga Ótima';
    default:
      return 'Plano Integrado de Corrida Runna';
  }
}

function getBeginnerWeekFocus(week: number): string {
  if (week <= 2) return 'Transição 1 min corrida suave / 2 min caminhada (ritmo conversacional)';
  if (week <= 4) return 'Transição 2 min corrida / 2 min caminhada + Aumento de cadência (+10%)';
  if (week <= 6) return 'Intervalos longos: 4 min corrida / 1 min caminhada com passada curta e suave';
  if (week <= 8) return 'Corrida contínua de 15 a 20 min sem interrupção';
  return 'Conquista dos 5 km contínuos com cadência estável e conforto respiratório';
}

/**
 * Preconditioning workout: walks + hopping for bones/tendons
 */
function createPreconditioningWorkout(
  week: number,
  dayNum: number,
  dayName: string,
  durationMin: number,
  targetKm: number
): RunnaWorkout {
  const blocks: WorkoutBlock[] = [
    {
      id: `w${week}_d${dayNum}_b1`,
      type: 'warmup',
      label: 'Aquecimento: Caminhada inicial',
      durationSeconds: 300,
      targetPaceZone: 'caminhada',
      instruction: 'Caminhe soltando braços e respirando profundamente.',
    },
    {
      id: `w${week}_d${dayNum}_b2`,
      type: 'walk',
      label: 'Caminhada Rápida Moderada',
      durationSeconds: (durationMin - 15) * 60,
      targetPaceZone: 'caminhada',
      instruction: 'Mantenha passada firme e postura ereta, ritmo conversacional acelerado.',
    },
    {
      id: `w${week}_d${dayNum}_b3`,
      type: 'stride',
      label: 'Saltitos Suaves (Hopping Preparatório)',
      durationSeconds: 180,
      instruction:
        'Dê pequenos saltitos no mesmo lugar com os dois pés (3x 30 segundos com 30s de pausa) para estimular o tecido ósseo e a rigidez do tendão [14].',
    },
    {
      id: `w${week}_d${dayNum}_b4`,
      type: 'cooldown',
      label: 'Desaquecimento suave',
      durationSeconds: 300,
      targetPaceZone: 'caminhada',
      instruction: 'Reduza o passo até a frequência cardíaca voltar ao normal.',
    },
  ];

  return {
    id: `wk_${week}_d${dayNum}`,
    weekNumber: week,
    dayNumber: dayNum,
    dayName,
    title: 'Caminhada Rápida & Saltitos Estruturais',
    category: 'walk_run',
    focus: 'Adaptação dos tendões e ossos ao impacto',
    description: `Sessão de ${durationMin} minutos de caminhada rápida acompanhada de 3 blocos de saltitos suaves para densidade óssea.`,
    estimatedMinutes: durationMin,
    estimatedDistanceKm: targetKm,
    blocks,
    biomechanicsTip: 'Aterrisse sempre no antepé/médio-pé durante os saltitos, com joelhos levemente flexionados.',
    completed: false,
  };
}

/**
 * Walk-Run intervals for beginners
 */
function createWalkRunWorkout(
  week: number,
  dayNum: number,
  dayName: string,
  activeWeek: number,
  isLonger = false
): RunnaWorkout {
  const runSec = activeWeek <= 2 ? 60 : activeWeek <= 4 ? 120 : activeWeek <= 6 ? 240 : 420;
  const walkSec = activeWeek <= 2 ? 120 : activeWeek <= 4 ? 90 : activeWeek <= 6 ? 60 : 60;
  const repeats = isLonger ? 7 : 5;

  const blocks: WorkoutBlock[] = [
    {
      id: `b_warmup`,
      type: 'warmup',
      label: 'Aquecimento: Caminhada Rápida',
      durationSeconds: 300,
      instruction: '5 minutos de caminhada enérgica para elevar temperatura muscular.',
    },
  ];

  for (let r = 1; r <= repeats; r++) {
    blocks.push({
      id: `b_run_${r}`,
      type: 'run_easy',
      label: `Corrida Suave (${Math.round(runSec / 60)} min) - Intervalo ${r}/${repeats}`,
      durationSeconds: runSec,
      targetPaceZone: 'z2_aerobico',
      instruction:
        'Trote confortável. Você deve conseguir falar frases completas sem perder o ar (Talk Test).',
    });
    if (r < repeats) {
      blocks.push({
        id: `b_walk_${r}`,
        type: 'walk',
        label: `Caminhada Recuperativa (${Math.round(walkSec / 60)} min)`,
        durationSeconds: walkSec,
        targetPaceZone: 'caminhada',
        instruction: 'Caminhe ritmado para baixar a frequência cardíaca antes do próximo tiro.',
      });
    }
  }

  blocks.push({
    id: `b_cooldown`,
    type: 'cooldown',
    label: 'Desaquecimento: Caminhada Lenta',
    durationSeconds: 300,
    instruction: '5 minutos de desaquecimento para recuperação musculoesquelética [5, 15].',
  });

  const totalMin = Math.round(
    blocks.reduce((acc, b) => acc + b.durationSeconds, 0) / 60
  );
  const targetKm = Math.round((totalMin * 0.1) * 10) / 10;

  return {
    id: `wk_${week}_d${dayNum}`,
    weekNumber: week,
    dayNumber: dayNum,
    dayName,
    title: `Caminhada-Corrida: ${Math.round(runSec / 60)}min Corrida / ${Math.round(walkSec / 60)}min Caminhada`,
    category: 'walk_run',
    focus: 'Construção da base aeróbica conversacional',
    description: `${repeats} repetições alternadas entre trote suave e caminhada de recuperação.`,
    estimatedMinutes: totalMin,
    estimatedDistanceKm: targetKm,
    blocks,
    biomechanicsTip:
      'Corra suave: faça menos barulho ao tocar o solo ("run softly") e aumente a cadência de passos [28, 55].',
    completed: false,
  };
}

/**
 * Polarized easy run (Z1/Z2)
 */
function createPolarizedEasyWorkout(
  week: number,
  dayNum: number,
  dayName: string,
  minutes: number,
  km: number
): RunnaWorkout {
  return {
    id: `wk_${week}_d${dayNum}`,
    weekNumber: week,
    dayNumber: dayNum,
    dayName,
    title: 'Rodagem Fácil Regenerativa (Zona 1/2)',
    category: 'run',
    focus: '80% do volume em baixa intensidade para densidade mitocondrial [27, 40]',
    description: `${minutes} minutos contínuos em ritmo muito confortável (Z1/Z2) sem acumular lactato.`,
    estimatedMinutes: minutes,
    estimatedDistanceKm: km,
    blocks: [
      {
        id: 'b1',
        type: 'warmup',
        label: 'Aquecimento Progressivo',
        durationSeconds: 300,
        instruction: 'Comece em ritmo de trote bem leve.',
      },
      {
        id: 'b2',
        type: 'run_easy',
        label: `Rodagem Contínua Leve (${minutes - 10} min)`,
        durationSeconds: (minutes - 10) * 60,
        targetPaceZone: 'z2_aerobico',
        instruction:
          'Mantenha ritmo puramente aeróbico (70% FCmax). Se a respiração ficar ofegante, diminua.',
      },
      {
        id: 'b3',
        type: 'cooldown',
        label: 'Desaquecimento',
        durationSeconds: 300,
        instruction: 'Trote muito leve para normalizar.',
      },
    ],
    biomechanicsTip: 'Mantenha a cadência alta mesmo em ritmo lento (em torno de 170-175 spm).',
    completed: false,
  };
}

/**
 * Interval Session at 95-110% of MAS
 */
function createIntervalMasWorkout(
  week: number,
  dayNum: number,
  dayName: string,
  wIndex: number
): RunnaWorkout {
  const reps = Math.min(8, 4 + Math.floor(wIndex / 2));
  const blocks: WorkoutBlock[] = [
    {
      id: 'b_wup',
      type: 'warmup',
      label: 'Aquecimento com Mobilidade Dinâmica',
      durationSeconds: 600,
      instruction: '10 minutos de trote leve + mobilidade de tornozelo e quadril.',
    },
    {
      id: 'b_strides',
      type: 'stride',
      label: '4x Acelerações Progressivas (Strides)',
      durationSeconds: 240,
      instruction: 'Acelere em 60m focando em postura e cadência rápida.',
    },
  ];

  for (let i = 1; i <= reps; i++) {
    blocks.push({
      id: `int_${i}`,
      type: 'run_interval_hard',
      label: `Tiro ${i}/${reps}: 95-105% VAM (1 min)`,
      durationSeconds: 60,
      targetPaceZone: 'z4_limiar_mas',
      instruction:
        'Ritmo forte e controlado (esforço 8.5/10). Foco no comprimento e frequência da passada [17, 41].',
    });
    if (i < reps) {
      blocks.push({
        id: `rec_${i}`,
        type: 'walk',
        label: 'Recuperação Ativa (1 min 30s)',
        durationSeconds: 90,
        targetPaceZone: 'caminhada',
        instruction: 'Caminhe ou trote bem lento para baixar o lactato sanguíneo.',
      });
    }
  }

  blocks.push({
    id: 'b_cool',
    type: 'cooldown',
    label: 'Desaquecimento Completo',
    durationSeconds: 420,
    instruction: '7 minutos de trote muito suave.',
  });

  const totalMin = Math.round(blocks.reduce((acc, b) => acc + b.durationSeconds, 0) / 60);

  return {
    id: `wk_${week}_d${dayNum}`,
    weekNumber: week,
    dayNumber: dayNum,
    dayName,
    title: `Sessão Intervalada MAS (${reps}x 1min a 95-105% VAM)`,
    category: 'run',
    focus: 'Elevação da Velocidade Aeróbica Máxima (20% polarizado) [17, 41]',
    description: `Treino de alta intensidade com ${reps} repetições de 1 minuto em ritmo forte e 1min30s de recuperação.`,
    estimatedMinutes: totalMin,
    estimatedDistanceKm: Math.round((totalMin * 0.16) * 10) / 10,
    blocks,
    biomechanicsTip: 'Braços ritmados a 90 graus, tronco ligeiramente inclinado a partir dos tornozelos.',
    completed: false,
  };
}

/**
 * Continuous running economy workout at 70-75% MAS
 */
function createEconomyRunWorkout(
  week: number,
  dayNum: number,
  dayName: string,
  minutes: number,
  km: number
): RunnaWorkout {
  return {
    id: `wk_${week}_d${dayNum}`,
    weekNumber: week,
    dayNumber: dayNum,
    dayName,
    title: 'Economia de Corrida (70-75% da VAM)',
    category: 'run',
    focus: 'Aprimoramento da eficiência metabólica e custo de O2 [17, 143]',
    description: `${minutes} minutos em ritmo constante no limiar aeróbico para otimizar economia de corrida.`,
    estimatedMinutes: minutes,
    estimatedDistanceKm: km,
    blocks: [
      {
        id: 'b1',
        type: 'warmup',
        label: 'Aquecimento',
        durationSeconds: 300,
        instruction: 'Trote leve.',
      },
      {
        id: 'b2',
        type: 'run_tempo',
        label: `Corrida no Ritmo de Economia (${minutes - 10} min)`,
        durationSeconds: (minutes - 10) * 60,
        targetPaceZone: 'z3_ritmo',
        instruction:
          'Ritmo firme e constante, 70-75% da sua velocidade aeróbica máxima.',
      },
      {
        id: 'b3',
        type: 'cooldown',
        label: 'Desaquecimento',
        durationSeconds: 300,
        instruction: 'Caminhada suave.',
      },
    ],
    biomechanicsTip: 'Minimize a oscilação vertical da cabeça; gaste energia para frente, não para cima.',
    completed: false,
  };
}

/**
 * Long easy run
 */
function createLongRunWorkout(
  week: number,
  dayNum: number,
  dayName: string,
  km: number
): RunnaWorkout {
  const estMin = Math.round(km * 6.5);
  return {
    id: `wk_${week}_d${dayNum}`,
    weekNumber: week,
    dayNumber: dayNum,
    dayName,
    title: `Longão Sustentável (${km} km)`,
    category: 'run',
    focus: 'Adaptação do glicogênio e resistência musculoesquelética [20, 36]',
    description: `Treino longo de ${km} km em ritmo puramente conversacional para construir resistência de base.`,
    estimatedMinutes: estMin,
    estimatedDistanceKm: km,
    blocks: [
      {
        id: 'b1',
        type: 'run_easy',
        label: `Longão Contínuo Z2 (${km} km)`,
        durationSeconds: estMin * 60,
        targetPaceZone: 'z2_aerobico',
        instruction: 'Mantenha ritmo constante e confortável do início ao fim.',
      },
    ],
    biomechanicsTip: 'Monitore sua postura: quando o cansaço bater, não incline a cabeça para frente nem curve os ombros.',
    completed: false,
  };
}

/**
 * Rehab / Post-Partum walk-run
 */
function createRehabWalkRunWorkout(
  week: number,
  dayNum: number,
  dayName: string,
  activeWeek: number,
  returnContext?: string,
  isWeekend = false
): RunnaWorkout {
  const runSeconds = Math.min(300, 30 + activeWeek * 30);
  const walkSeconds = Math.max(60, 150 - activeWeek * 15);
  const reps = isWeekend ? 6 : 5;

  const blocks: WorkoutBlock[] = [
    {
      id: 'bw',
      type: 'warmup',
      label: 'Aquecimento Lento & Ativação de Core',
      durationSeconds: 360,
      instruction:
        returnContext === 'post_partum'
          ? 'Caminhada suave com ativação suave da musculatura profunda do abdômen e assoalho pélvico.'
          : 'Caminhada progressiva sem dor articular.',
    },
  ];

  for (let i = 1; i <= reps; i++) {
    blocks.push({
      id: `r_${i}`,
      type: 'run_easy',
      label: `Trote Muito Leve (${runSeconds}s) - Bloco ${i}`,
      durationSeconds: runSeconds,
      targetPaceZone: 'z1_facil',
      instruction:
        'Trote suave e cadenciado. Se sentir dor acima de 2 na escala de 0-10 ou peso no períneo, pare imediatamente e caminhe.',
    });
    if (i < reps) {
      blocks.push({
        id: `w_${i}`,
        type: 'walk',
        label: `Caminhada Regenerativa (${walkSeconds}s)`,
        durationSeconds: walkSeconds,
        targetPaceZone: 'caminhada',
        instruction: 'Caminhe respirando suavemente.',
      });
    }
  }

  blocks.push({
    id: 'bc',
    type: 'cooldown',
    label: 'Desaquecimento',
    durationSeconds: 300,
    instruction: 'Caminhada lenta para estabilização tecidual.',
  });

  const totalMin = Math.round(blocks.reduce((acc, b) => acc + b.durationSeconds, 0) / 60);

  return {
    id: `wk_${week}_d${dayNum}`,
    weekNumber: week,
    dayNumber: dayNum,
    dayName,
    title:
      returnContext === 'post_partum'
        ? `Transição Pós-Parto: ${runSeconds}s Trote / ${walkSeconds}s Caminhada`
        : `Retorno Carga Ótima: ${runSeconds}s Trote / ${walkSeconds}s Caminhada`,
    category: 'walk_run',
    focus: 'Progressão gradual de carga com monitoramento estrito de sintomas [22, 103]',
    description: `Treino de transição com ${reps} repetições suaves, priorizando absorção de impacto sem dor.`,
    estimatedMinutes: totalMin,
    estimatedDistanceKm: Math.round((totalMin * 0.08) * 10) / 10,
    blocks,
    biomechanicsTip:
      'Cadência alta e passos curtos reduzem as forças de impacto nas articulações em até 20% [1, 15].',
    completed: false,
  };
}

/**
 * Cross training for rehab (swimming, cycling)
 */
function createCrossTrainingWorkout(
  week: number,
  dayNum: number,
  dayName: string,
  minutes: number,
  returnContext?: string
): RunnaWorkout {
  return {
    id: `wk_${week}_d${dayNum}`,
    weekNumber: week,
    dayNumber: dayNum,
    dayName,
    title: 'Cross-Training Cardiovascular (Bicicleta ou Natação)',
    category: 'cross_training',
    focus: 'Manutenção da capacidade aeróbica sem impacto musculoesquelético [1, 6, 103]',
    description: `${minutes} minutos de ciclismo estacionário ou natação em ritmo suave a moderado.`,
    estimatedMinutes: minutes,
    blocks: [
      {
        id: 'ct_1',
        type: 'warmup',
        label: 'Giro Leve',
        durationSeconds: 300,
        instruction: 'Cadência leve sem carga.',
      },
      {
        id: 'ct_2',
        type: 'run_easy',
        label: `Cardio Sem Impacto (${minutes - 10} min)`,
        durationSeconds: (minutes - 10) * 60,
        targetPaceZone: 'z2_aerobico',
        instruction: 'Mantenha ritmo constante em Z2, mantendo condicionamento sem sobrecarga tecidual.',
      },
      {
        id: 'ct_3',
        type: 'cooldown',
        label: 'Desaquecimento',
        durationSeconds: 300,
        instruction: 'Giro solto final.',
      },
    ],
    biomechanicsTip: 'Aproveite para focar na oxigenação e postura sem estresse articular.',
    completed: false,
  };
}

/**
 * Strength workout card
 */
function createStrengthWorkout(
  week: number,
  dayNum: number,
  dayName: string,
  routineId: 'foot_core' | 'glutes_pelvis' | 'calves_achilles' | 'quads_knees' | 'core_pelvic_floor'
): RunnaWorkout {
  const names: Record<string, string> = {
    foot_core: 'Fortalecimento do Pé (Foot Core) & Estabilidade de Arco',
    glutes_pelvis: 'Fortalecimento Glúteo Médio & Prevenção de Queda Pélvica',
    calves_achilles: 'Panturrilhas Excêntricas & Tendão de Aquiles',
    quads_knees: 'Quadríceps & Proteção Patelofemoral do Joelho',
    core_pelvic_floor: 'Core Profundo & Assoalho Pélvico',
  };

  return {
    id: `wk_${week}_d${dayNum}`,
    weekNumber: week,
    dayNumber: dayNum,
    dayName,
    title: names[routineId] || 'Treino de Fortalecimento para Corredores',
    category: 'strength',
    focus: 'Prevenção de lesões (RRIs) e eficiência biomecânica [11, 38, 106]',
    description:
      'Sessão com peso corporal e resistências leves focada nos elos frágeis biomecânicos.',
    estimatedMinutes: 25,
    strengthRoutineId: routineId,
    blocks: [],
    biomechanicsTip: 'Controle a velocidade da fase excêntrica (descida) em todos os exercícios.',
    completed: false,
  };
}

/**
 * Calculate Acute:Chronic Workload Ratio (ACWR) and 10% rule validation
 */
export function calculateACWR(
  weeklyKmHistory: { weekLabel: string; km: number }[],
  currentWeekKm: number
): ACWRStatus {
  // Acute load is the current week's mileage
  const acuteLoad = Math.round(currentWeekKm * 10) / 10;

  // Chronic load is the average of the last 4 weeks (or available history)
  let pastLoads = weeklyKmHistory.map((h) => h.km).filter((km) => km > 0);
  if (pastLoads.length === 0) {
    pastLoads = [Math.max(1, currentWeekKm)];
  }

  const chronicLoad =
    Math.round((pastLoads.reduce((a, b) => a + b, 0) / pastLoads.length) * 10) / 10;

  const ratio = chronicLoad > 0 ? Math.round((acuteLoad / chronicLoad) * 100) / 100 : 1.0;

  // 10% rule check: compare with the immediately preceding week
  const lastWeekKm = pastLoads[pastLoads.length - 1] || 0;
  const tenPercentRuleViolated = lastWeekKm > 0 && acuteLoad > lastWeekKm * 1.1;

  let status: ACWRStatus['status'] = 'optimal';
  let label = 'Zona Ótima (Sweet Spot)';
  let message =
    'Carga equilibrada com adaptação progressiva sustentável e baixo risco de lesão [26, 87].';

  if (ratio < 0.8) {
    status = 'low';
    label = 'Carga Baixa / Sub-treinamento';
    message = 'O volume atual está abaixo da capacidade crônica desenvolvida.';
  } else if (ratio >= 0.8 && ratio <= 1.3) {
    status = 'optimal';
    label = 'Sweet Spot (0.8 - 1.3)';
    message = 'Equilíbrio ideal entre condicionamento e segurança tecidual [26].';
  } else if (ratio > 1.3 && ratio <= 1.5) {
    status = 'caution';
    label = 'Zona de Atenção (1.3 - 1.5)';
    message = 'Aumento rápido de carga. Monitore dores musculares e qualidade de sono.';
  } else {
    status = 'danger';
    label = 'Zona de Perigo (ACWR > 1.5)';
    message =
      'Alerta: Risco de lesão drastically aumentado por aumento abrupto de carga ("too much, too soon") [26, 87].';
  }

  return {
    acuteLoad,
    chronicLoad,
    ratio,
    status,
    label,
    message,
    tenPercentRuleViolated,
    weeklyHistory: weeklyKmHistory,
  };
}
