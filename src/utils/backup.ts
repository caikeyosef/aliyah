import { STORAGE_KEYS } from './storage';
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
import { DailyWaterRecord } from './storage';

export interface AliyahBackupPayload {
  appName: 'Aliyah';
  version: 1;
  exportedAt: string;
  data: {
    profile?: UserProfile;
    foodLogs?: FoodLogItem[];
    workoutTemplates?: WorkoutTemplate[];
    workoutLogs?: WorkoutSession[];
    weightLogs?: WeightLog[];
    progressPhotos?: ProgressPhoto[];
    coachFeedback?: AICoachFeedback;
    hasOnboarded?: boolean;
    waterRecords?: Record<string, DailyWaterRecord>;
    habits?: HabitItem[];
  };
}

export interface BackupCounts {
  workoutTemplates: number;
  workoutLogs: number;
  weightLogs: number;
  foodLogs: number;
  habits: number;
  photos: number;
}

/**
 * Reads all current data from localStorage and returns counts
 */
export function getCurrentDataCounts(): BackupCounts {
  try {
    const templates = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKOUT_TEMPLATES) || '[]');
    const workouts = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS) || '[]');
    const weights = JSON.parse(localStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS) || '[]');
    const foods = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOOD_LOGS) || '[]');
    const habits = JSON.parse(localStorage.getItem(STORAGE_KEYS.HABITS) || '[]');
    const photos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS_PHOTOS) || '[]');

    return {
      workoutTemplates: Array.isArray(templates) ? templates.length : 0,
      workoutLogs: Array.isArray(workouts) ? workouts.length : 0,
      weightLogs: Array.isArray(weights) ? weights.length : 0,
      foodLogs: Array.isArray(foods) ? foods.length : 0,
      habits: Array.isArray(habits) ? habits.length : 0,
      photos: Array.isArray(photos) ? photos.length : 0,
    };
  } catch {
    return {
      workoutTemplates: 0,
      workoutLogs: 0,
      weightLogs: 0,
      foodLogs: 0,
      habits: 0,
      photos: 0,
    };
  }
}

/**
 * Exports all Aliyah application data as a formatted JSON file download
 */
export function exportAppData(): { success: boolean; filename: string } {
  try {
    const profile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    const foodLogs = localStorage.getItem(STORAGE_KEYS.FOOD_LOGS);
    const workoutTemplates = localStorage.getItem(STORAGE_KEYS.WORKOUT_TEMPLATES);
    const workoutLogs = localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS);
    const weightLogs = localStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS);
    const progressPhotos = localStorage.getItem(STORAGE_KEYS.PROGRESS_PHOTOS);
    const coachFeedback = localStorage.getItem(STORAGE_KEYS.COACH_FEEDBACK);
    const hasOnboarded = localStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED);
    const waterRecords = localStorage.getItem(STORAGE_KEYS.WATER_RECORDS);
    const habits = localStorage.getItem(STORAGE_KEYS.HABITS);

    const payload: AliyahBackupPayload = {
      appName: 'Aliyah',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        profile: profile ? JSON.parse(profile) : undefined,
        foodLogs: foodLogs ? JSON.parse(foodLogs) : [],
        workoutTemplates: workoutTemplates ? JSON.parse(workoutTemplates) : [],
        workoutLogs: workoutLogs ? JSON.parse(workoutLogs) : [],
        weightLogs: weightLogs ? JSON.parse(weightLogs) : [],
        progressPhotos: progressPhotos ? JSON.parse(progressPhotos) : [],
        coachFeedback: coachFeedback ? JSON.parse(coachFeedback) : undefined,
        hasOnboarded: hasOnboarded === 'true',
        waterRecords: waterRecords ? JSON.parse(waterRecords) : {},
        habits: habits ? JSON.parse(habits) : [],
      },
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `aliyah-backup-${dateStr}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (err) {
    console.error('Falha ao exportar backup', err);
    throw new Error('Não foi possível gerar o arquivo de backup.');
  }
}

export interface ImportResult {
  success: boolean;
  message: string;
  data?: AliyahBackupPayload['data'];
  counts?: BackupCounts;
}

/**
 * Validates and imports data from a JSON string into localStorage
 */
export function importAppData(jsonString: string): ImportResult {
  try {
    const parsed = JSON.parse(jsonString);

    // Support both wrapped AliyahBackupPayload and direct data object
    let targetData: AliyahBackupPayload['data'] | null = null;

    if (parsed && typeof parsed === 'object') {
      if (parsed.data && typeof parsed.data === 'object') {
        targetData = parsed.data;
      } else if (parsed.profile || parsed.workoutTemplates || parsed.workoutLogs || parsed.weightLogs) {
        // Direct object format
        targetData = parsed;
      }
    }

    if (!targetData) {
      return {
        success: false,
        message: 'O arquivo selecionado não contém um formato de backup válido do Aliyah.',
      };
    }

    // Restore to localStorage safely
    if (targetData.profile) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(targetData.profile));
    }
    if (Array.isArray(targetData.foodLogs)) {
      localStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(targetData.foodLogs));
    }
    if (Array.isArray(targetData.workoutTemplates)) {
      localStorage.setItem(STORAGE_KEYS.WORKOUT_TEMPLATES, JSON.stringify(targetData.workoutTemplates));
    }
    if (Array.isArray(targetData.workoutLogs)) {
      localStorage.setItem(STORAGE_KEYS.WORKOUT_LOGS, JSON.stringify(targetData.workoutLogs));
    }
    if (Array.isArray(targetData.weightLogs)) {
      localStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(targetData.weightLogs));
    }
    if (Array.isArray(targetData.progressPhotos)) {
      localStorage.setItem(STORAGE_KEYS.PROGRESS_PHOTOS, JSON.stringify(targetData.progressPhotos));
    }
    if (targetData.coachFeedback) {
      localStorage.setItem(STORAGE_KEYS.COACH_FEEDBACK, JSON.stringify(targetData.coachFeedback));
    }
    if (typeof targetData.hasOnboarded === 'boolean') {
      localStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, targetData.hasOnboarded ? 'true' : 'false');
    } else {
      localStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, 'true');
    }
    if (targetData.waterRecords && typeof targetData.waterRecords === 'object') {
      localStorage.setItem(STORAGE_KEYS.WATER_RECORDS, JSON.stringify(targetData.waterRecords));
    }
    if (Array.isArray(targetData.habits)) {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(targetData.habits));
    }

    const counts: BackupCounts = {
      workoutTemplates: Array.isArray(targetData.workoutTemplates) ? targetData.workoutTemplates.length : 0,
      workoutLogs: Array.isArray(targetData.workoutLogs) ? targetData.workoutLogs.length : 0,
      weightLogs: Array.isArray(targetData.weightLogs) ? targetData.weightLogs.length : 0,
      foodLogs: Array.isArray(targetData.foodLogs) ? targetData.foodLogs.length : 0,
      habits: Array.isArray(targetData.habits) ? targetData.habits.length : 0,
      photos: Array.isArray(targetData.progressPhotos) ? targetData.progressPhotos.length : 0,
    };

    return {
      success: true,
      message: 'Dados restaurados com sucesso no seu dispositivo!',
      data: targetData,
      counts,
    };
  } catch (err) {
    console.error('Falha ao importar backup', err);
    return {
      success: false,
      message: 'Erro ao processar o arquivo. Verifique se o arquivo é um JSON válido.',
    };
  }
}
