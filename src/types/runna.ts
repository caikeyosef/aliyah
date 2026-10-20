export type RunnerLevel = 'inactive' | 'sporadic' | 'regular' | 'rehab';

export type RunnerGoal =
  | 'learn_to_run'      // Iniciantes: O Caminho para os 5 km (Walk-Run)
  | 'speed_performance' // Melhora de Desempenho e Velocidade (Polarizado 80/20, VAM/MAS)
  | 'distance_endurance'// Aumento de Distância e Resistência (10k, 21k, 42k, Regra dos 10%)
  | 'return_safe';      // Voltar a correr pós-lesão ou pós-parto (Carga Ótima)

export type RunnerTargetDistance = '5k' | '10k' | '21k' | '42k';

export type ReturnContext = 'injury' | 'post_partum' | 'long_break';

export type WorkoutBlockType =
  | 'warmup'
  | 'run_easy'
  | 'run_tempo'
  | 'run_interval_hard'
  | 'walk'
  | 'stride'
  | 'cooldown';

export interface WorkoutBlock {
  id: string;
  type: WorkoutBlockType;
  label: string;
  durationSeconds: number;
  distanceMeters?: number;
  targetPaceZone?: 'z1_facil' | 'z2_aerobico' | 'z3_ritmo' | 'z4_limiar_mas' | 'z5_tiro' | 'caminhada';
  targetCadence?: number; // spm
  instruction: string;
}

export type WorkoutCategory = 'run' | 'walk_run' | 'strength' | 'cross_training' | 'rest';

export interface RunnaWorkout {
  id: string;
  weekNumber: number;
  dayNumber: number;
  dayName: string; // 'Segunda', 'Quarta', 'Sexta', etc.
  title: string;
  category: WorkoutCategory;
  focus: string; // ex: "Intervalos Caminhada-Corrida", "Treino Polarizado 80/20", "Fortalecimento Foot Core"
  description: string;
  estimatedMinutes: number;
  estimatedDistanceKm?: number;
  blocks: WorkoutBlock[];
  biomechanicsTip: string;
  strengthRoutineId?: 'foot_core' | 'glutes_pelvis' | 'calves_achilles' | 'quads_knees' | 'core_pelvic_floor';
  completed: boolean;
  completedDate?: string;
  completedDistanceKm?: number;
  completedDurationSeconds?: number;
  painScorePostRun?: number; // 0 to 10 scale
  rpeScorePostRun?: number;  // 1 to 10
  feedbackNotes?: string;
  adaptedDueToPain?: boolean;
}

export interface ReadinessCheckin {
  id: string;
  date: string;
  painScore: number; // 0 to 10
  painLocation?: string;
  sleepQuality: number; // 1 to 5
  fatigueLevel: number; // 1 to 5
  motivationLevel: number; // 1 to 5
  status: 'safe' | 'caution' | 'danger'; // 0-2 safe, 3-5 caution, 6-10 danger
  recommendation: string;
  createdAt: string;
}

export type DayOfWeek =
  | 'Segunda'
  | 'Terça'
  | 'Quarta'
  | 'Quinta'
  | 'Sexta'
  | 'Sábado'
  | 'Domingo';

export interface RunnaProfile {
  intakeCompleted: boolean;
  level: RunnerLevel;
  goal: RunnerGoal;
  targetDistance: RunnerTargetDistance;
  returnContext?: ReturnContext;
  daysPerWeek: number; // 2, 3, 4, 5, 6
  selectedDays: DayOfWeek[]; // Dias específicos da semana escolhidos pelo usuário
  includeStrength: boolean; // Corrida + Fortalecimento vs Apenas Corrida
  injuriesLast12Months: string[];
  currentTalkTestComfort: 'conversational' | 'heavy_breathing';
  targetWeeks: number; // Semanas totais do plano
  currentWeek: number;
  preferredCadence: number;
  usesShoeRotation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RunnaPlan {
  id: string;
  name: string;
  goal: RunnerGoal;
  level: RunnerLevel;
  totalWeeks: number;
  currentWeek: number;
  weeks: {
    weekNumber: number;
    title: string;
    focus: string;
    weeklyTargetKm: number;
    workouts: RunnaWorkout[];
  }[];
  generatedAt: string;
}

export interface ACWRStatus {
  acuteLoad: number; // km in current week (last 7 days)
  chronicLoad: number; // average weekly km over last 4 weeks
  ratio: number; // acute / chronic
  status: 'optimal' | 'low' | 'caution' | 'danger';
  label: string;
  message: string;
  tenPercentRuleViolated: boolean;
  weeklyHistory: { weekLabel: string; km: number }[];
}

export interface StrengthExerciseItem {
  id: string;
  name: string;
  category: 'foot_core' | 'glutes_pelvis' | 'calves_achilles' | 'quads_knees' | 'core_pelvic_floor';
  targetMuscles: string;
  clinicalBenefit: string;
  setsReps: string;
  instructions: string[];
  keyCue: string;
  citationRef: string;
}
