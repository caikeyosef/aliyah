export type Gender = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'      // Pouco ou nenhum exercício
  | 'light'          // Exercício leve 1-3 dias/semana
  | 'moderate'       // Exercício moderado 3-5 dias/semana
  | 'very_active'    // Exercício pesado 6-7 dias/semana
  | 'extra_active';  // Treinos intensos diários / trabalho braçal

export type FitnessGoal =
  | 'none'           // Sem plano definido / Modo Livre
  | 'lose_weight'    // Emagrecer / Perda de gordura
  | 'gain_weight'    // Ganho de peso / Hipertrofia
  | 'maintain'       // Manter peso / Saúde
  | 'recomp';        // Recomposição corporal

export type GoalIntensity = 'mild' | 'moderate' | 'aggressive';

export interface UserProfile {
  name: string;
  gender: Gender;
  age: number;
  height: number;           // em cm
  currentWeight: number;    // em kg
  startWeight: number;      // em kg
  targetWeight: number;     // em kg
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  goalIntensity: GoalIntensity;
  hasActiveGoal: boolean;   // true se o usuário escolheu um plano/meta
  targetDays: number;       // Dias exatos (ex: 45, 60, 75 dias quebrados)
  startDate: string;        // YYYY-MM-DD
  targetDate: string;       // YYYY-MM-DD

  // Métricas calculadas
  bmr: number;              // Taxa metabólica basal (kcal)
  tdee: number;             // Gasto energético total diário (kcal)
  calorieAdjustment: number;// Déficit (-) ou Superávit (+)
  targetCalories: number;   // Meta diária de calorias
  targetProtein: number;    // Gramas de proteína
  targetCarbs: number;      // Gramas de carboidrato
  targetFat: number;        // Gramas de gordura
  targetWater: number;      // ml de água por dia
  projectedWeightChangeKg: number; // Ex: -4.2 kg no período informado
  projectedFinalWeight: number;
}

export type MealType = 'breakfast' | 'lunch' | 'afternoon_snack' | 'dinner' | 'snacks';

export interface FoodItemBreakdown {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodLogItem {
  id: string;
  date: string;             // YYYY-MM-DD
  mealType: MealType;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  imageUrl?: string;
  aiAnalyzed?: boolean;
  aiConfidence?: number;
  healthTip?: string;
  items?: FoodItemBreakdown[];
  createdAt: string;
}

export interface ExerciseSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  rpe?: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: 'peito' | 'costas' | 'pernas' | 'ombros' | 'bracos' | 'abdomen';
  sets: ExerciseSet[];
  targetReps?: string;
  pr?: number;
  notes?: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  name: string;
  muscleGroup: 'peito' | 'costas' | 'pernas' | 'ombros' | 'bracos' | 'abdomen';
  defaultSets: number;
  targetReps?: string;
  lastWeightKg?: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;             // Ex: "Ficha A - Peito e Tríceps"
  muscleFocus?: string;     // Ex: "Peito e Tríceps"
  exercises: WorkoutTemplateExercise[];
  createdAt: string;
}

export interface WorkoutSession {
  id: string;
  date: string;             // YYYY-MM-DD
  templateId?: string;      // ID da ficha usada (se houver)
  name: string;
  durationMinutes: number;
  estimatedCaloriesBurned: number;
  exercises: WorkoutExercise[];
  notes?: string;
  completed: boolean;
}

export interface ExerciseHistoryRecord {
  date: string;
  workoutName: string;
  weightKg: number;
  reps: number;
  setsCount: number;
}

export interface WeightLog {
  id: string;
  date: string;             // YYYY-MM-DD
  weightKg: number;
  notes?: string;
}

export interface ProgressPhoto {
  id: string;
  date: string;             // YYYY-MM-DD
  title: string;
  pose: 'front' | 'side' | 'back';
  weightAtTime: number;
  imageUrl: string;
  notes?: string;
}

export interface AICoachFeedback {
  diagnostico: string;
  dicasPraticas: string[];
  motivacao: string;
  projecaoConselho: string;
  updatedAt: string;
}

export type HabitCategory = 'treino' | 'nutricao' | 'saude' | 'mente' | 'geral';

export interface HabitItem {
  id: string;
  name: string;
  category: HabitCategory;
  description?: string;
  targetPerWeek: number; // Ex: 7 (todos os dias)
  completedDates: string[]; // YYYY-MM-DD
  iconName: string; // 'Dumbbell' | 'Droplet' | 'Pill' | 'Moon' | 'BookOpen' | 'Flame' | 'Zap' | 'Heart'
  createdAt: string;
}
