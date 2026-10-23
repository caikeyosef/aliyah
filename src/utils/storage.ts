import {
  UserProfile,
  FoodLogItem,
  WorkoutSession,
  WorkoutTemplate,
  WeightLog,
  ProgressPhoto,
  AICoachFeedback,
  HabitItem,
} from '../types/fitness';
import { GPXActivity } from '../types/running';
import { RunnaProfile, RunnaPlan, ReadinessCheckin } from '../types/runna';
import { calculateCompleteProfile } from './fitnessMath';

export const STORAGE_KEYS = {
  PROFILE: 'fitmorph_profile',
  FOOD_LOGS: 'fitmorph_food_logs',
  WORKOUT_TEMPLATES: 'fitmorph_workout_templates',
  WORKOUT_LOGS: 'fitmorph_workout_logs',
  WEIGHT_LOGS: 'fitmorph_weight_logs',
  PROGRESS_PHOTOS: 'fitmorph_progress_photos',
  COACH_FEEDBACK: 'fitmorph_coach_feedback',
  HAS_ONBOARDED: 'fitmorph_has_onboarded',
  WATER_RECORDS: 'fitmorph_water_records',
  HABITS: 'fitmorph_habits',
  RUNNING_ACTIVITIES: 'fitmorph_running_activities',
  RUNNA_PROFILE: 'fitmorph_runna_profile',
  RUNNA_PLAN: 'fitmorph_runna_plan',
  RUNNA_READINESS: 'fitmorph_runna_readiness',
  FEED_POSTS: 'fitmorph_feed_posts',
  ACTIVE_WORKOUT_SESSION: 'fitmorph_active_workout_session',
  ACTIVE_TAB: 'fitmorph_active_tab',
};

export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initial clean profile
export const DEFAULT_INITIAL_PROFILE: UserProfile = calculateCompleteProfile({
  name: '',
  gender: 'male',
  age: 25,
  height: 175,
  currentWeight: 75.0,
  activityLevel: 'moderate',
  goal: 'none',
  hasActiveGoal: false,
  targetDays: 60,
  startDate: getTodayDateStr(),
});

// Clean initial states:
// 1. Food logs start empty (0 calories consumed)
export const INITIAL_FOOD_LOGS: FoodLogItem[] = [];

// 2. Workout templates start completely empty for the user to create their own
export const INITIAL_WORKOUT_TEMPLATES: WorkoutTemplate[] = [];

// 3. Workouts start completely empty
export const INITIAL_WORKOUT_LOGS: WorkoutSession[] = [];

// 4. Weight logs start empty until user completes onboarding
export const INITIAL_WEIGHT_LOGS: WeightLog[] = [];

// 5. Progress photos start empty
export const INITIAL_PROGRESS_PHOTOS: ProgressPhoto[] = [];

// 6. Habit Tracker defaults (popular fitness habits)
export const INITIAL_HABITS: HabitItem[] = [
  {
    id: 'habit-1',
    name: 'Tomar Creatina (5g)',
    category: 'nutricao',
    description: 'Consistência diária para manter a saturação intramuscular',
    targetPerWeek: 7,
    completedDates: [],
    iconName: 'Pill',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-2',
    name: 'Bater Meta de Água',
    category: 'saude',
    description: 'Manter a hidratação diária do corpo e músculos',
    targetPerWeek: 7,
    completedDates: [],
    iconName: 'Droplet',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-3',
    name: 'Treino de Força / Ficha do Dia',
    category: 'treino',
    description: 'Executar a sessão planejada e registrar as cargas',
    targetPerWeek: 5,
    completedDates: [],
    iconName: 'Dumbbell',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-4',
    name: 'Dormir 7 a 8 Horas',
    category: 'saude',
    description: 'Sono anabólico e recuperação do sistema nervoso',
    targetPerWeek: 7,
    completedDates: [],
    iconName: 'Moon',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_COACH_FEEDBACK: AICoachFeedback = {
  diagnostico: 'Bem-vindo ao Aliyah! Seu motor matemático de evolução corporal e acompanhamento fisiológico 100% offline está ativo.',
  dicasPraticas: [
    'Crie suas fichas de treino (ex: Peito, Costas, Pernas) na aba de Treinos.',
    'Cada carga e repetição informada no treino fica gravada para você acompanhar a progressão.',
    'Acompanhe sua hidratação diária começando do 0 ml até sua meta personalizada.',
  ],
  motivacao: 'A constância supera a intensidade. Registre seus treinos e cargas a cada sessão!',
  projecaoConselho: 'Você pode definir um plano de dias exatos a qualquer momento no perfil ou na aba de metas.',
  updatedAt: new Date().toISOString(),
};

// Storage helper functions
export function getStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler perfil do localStorage', e);
  }
  return DEFAULT_INITIAL_PROFILE;
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Erro ao salvar perfil', e);
  }
}

export function getStoredFoodLogs(): FoodLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOOD_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler alimentos', e);
  }
  return INITIAL_FOOD_LOGS;
}

export function saveStoredFoodLogs(logs: FoodLogItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Erro ao salvar alimentos', e);
  }
}

export function getStoredWorkoutTemplates(): WorkoutTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUT_TEMPLATES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler fichas de treino', e);
  }
  return INITIAL_WORKOUT_TEMPLATES;
}

export function saveStoredWorkoutTemplates(templates: WorkoutTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKOUT_TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Erro ao salvar fichas de treino', e);
  }
}

export function getStoredWorkouts(): WorkoutSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler sessões de treino', e);
  }
  return INITIAL_WORKOUT_LOGS;
}

export function saveStoredWorkouts(workouts: WorkoutSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKOUT_LOGS, JSON.stringify(workouts));
  } catch (e) {
    console.error('Erro ao salvar sessões de treino', e);
  }
}

export function getStoredWeightLogs(): WeightLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler pesos', e);
  }
  return INITIAL_WEIGHT_LOGS;
}

export function saveStoredWeightLogs(logs: WeightLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Erro ao salvar pesos', e);
  }
}

export function getStoredPhotos(): ProgressPhoto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS_PHOTOS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler fotos', e);
  }
  return INITIAL_PROGRESS_PHOTOS;
}

export function saveStoredPhotos(photos: ProgressPhoto[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS_PHOTOS, JSON.stringify(photos));
  } catch (e) {
    console.error('Erro ao salvar fotos', e);
  }
}

export function getStoredCoachFeedback(): AICoachFeedback {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COACH_FEEDBACK);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler coach feedback', e);
  }
  return DEFAULT_COACH_FEEDBACK;
}

export function saveStoredCoachFeedback(feedback: AICoachFeedback): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COACH_FEEDBACK, JSON.stringify(feedback));
  } catch (e) {
    console.error('Erro ao salvar coach feedback', e);
  }
}

export function getStoredHabits(): HabitItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler hábitos do localStorage', e);
  }
  return INITIAL_HABITS;
}

export function saveStoredHabits(habits: HabitItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch (e) {
    console.error('Erro ao salvar hábitos no localStorage', e);
  }
}

export function hasUserCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED) === 'true';
  } catch {
    return false;
  }
}

export function setHasUserCompletedOnboarding(completed: boolean): void {
  try {
    if (completed) {
      localStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.HAS_ONBOARDED);
      localStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, 'false');
    }
  } catch (e) {
    console.error('Erro ao atualizar status de onboarding', e);
  }
}

export function clearAllStoredData(): void {
  try {
    // Remove all known keys
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    // Also clear everything in localStorage
    localStorage.clear();
  } catch (e) {
    console.error('Erro ao limpar localStorage', e);
  }
}

export interface WaterEntry {
  id: string;
  time: string;
  amountMl: number;
  containerName: string;
}

export interface DailyWaterRecord {
  date: string;
  consumedMl: number;
  targetMl: number;
  entries: WaterEntry[];
}

export function getStoredWaterForDate(dateStr: string, defaultTargetMl: number): DailyWaterRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WATER_RECORDS);
    if (raw) {
      const all: Record<string, DailyWaterRecord> = JSON.parse(raw);
      if (all[dateStr]) {
        return all[dateStr];
      }
    }
  } catch (e) {
    console.error('Erro ao ler água do localStorage', e);
  }
  return {
    date: dateStr,
    consumedMl: 0,
    targetMl: defaultTargetMl || 2500,
    entries: [],
  };
}

export function saveStoredWaterForDate(record: DailyWaterRecord): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WATER_RECORDS);
    const all: Record<string, DailyWaterRecord> = raw ? JSON.parse(raw) : {};
    all[record.date] = record;
    localStorage.setItem(STORAGE_KEYS.WATER_RECORDS, JSON.stringify(all));
  } catch (e) {
    console.error('Erro ao salvar água no localStorage', e);
  }
}

export function loadStoredRuns(): GPXActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RUNNING_ACTIVITIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Erro ao carregar corridas do localStorage', e);
  }
  return [];
}

export function saveStoredRuns(runs: GPXActivity[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RUNNING_ACTIVITIES, JSON.stringify(runs));
  } catch (e) {
    console.error('Erro ao salvar corridas no localStorage', e);
  }
}

export function loadRunnaProfile(): RunnaProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RUNNA_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao carregar perfil Runna', e);
  }
  return null;
}

export function saveRunnaProfile(profile: RunnaProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RUNNA_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Erro ao salvar perfil Runna', e);
  }
}

export function loadRunnaPlan(): RunnaPlan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RUNNA_PLAN);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao carregar plano Runna', e);
  }
  return null;
}

export function saveRunnaPlan(plan: RunnaPlan): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RUNNA_PLAN, JSON.stringify(plan));
  } catch (e) {
    console.error('Erro ao salvar plano Runna', e);
  }
}

export function loadReadinessCheckins(): ReadinessCheckin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RUNNA_READINESS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Erro ao carregar check-ins de prontidão', e);
  }
  return [];
}

export function saveReadinessCheckin(checkin: ReadinessCheckin): void {
  try {
    const all = loadReadinessCheckins();
    const updated = [checkin, ...all.filter((c) => c.id !== checkin.id)].slice(0, 60);
    localStorage.setItem(STORAGE_KEYS.RUNNA_READINESS, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao salvar check-in de prontidão', e);
  }
}

export interface ActiveWorkoutPersistence {
  session: WorkoutSession;
  startTime: number;
  restTimerEndTime?: number | null;
  restTimerDuration?: number;
  subView?: 'fichas' | 'progression' | 'history';
}

export function getStoredActiveWorkoutSession(): ActiveWorkoutPersistence | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.session && typeof parsed.session === 'object') {
        return parsed as ActiveWorkoutPersistence;
      }
    }
  } catch (e) {
    console.error('Erro ao ler treino ativo em andamento', e);
  }
  return null;
}

export function saveStoredActiveWorkoutSession(data: ActiveWorkoutPersistence | null): void {
  try {
    if (data && data.session) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
    }
  } catch (e) {
    console.error('Erro ao salvar treino ativo em andamento', e);
  }
}

export function clearStoredActiveWorkoutSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
  } catch (e) {
    console.error('Erro ao limpar treino ativo', e);
  }
}

export function getStoredActiveTab(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
  } catch {
    return null;
  }
}

export function saveStoredActiveTab(tab: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tab);
  } catch {
    // LocalStorage full or blocked
  }
}

