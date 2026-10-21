export type FeedActivityType = 'workout' | 'running_gpx' | 'manual';

export interface FeedExerciseItem {
  id: string;
  name: string;
  muscleGroup?: string;
  setsCount: number;
  totalReps: number;
  maxWeightKg: number;
  volumeKg: number;
  setsDetail: string; // Ex: "4x 80kg, 85kg, 90kg, 90kg"
  isPr?: boolean;
}

export interface FeedWorkoutSummary {
  workoutId: string;
  templateId?: string;
  name: string;
  muscleGroups: string[];
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  durationMinutes: number;
  caloriesBurned: number;
  exercises: FeedExerciseItem[];
  prsAchieved?: string[];
}

export interface FeedSplitItem {
  km: number;
  paceFormatted: string;
  elevationDiffM: number;
  isFastest?: boolean;
}

export interface FeedRunningSummary {
  activityId: string;
  title: string;
  filename?: string;
  distanceKm: number;
  durationSeconds: number;
  movingTimeFormatted: string;
  avgPaceFormatted: string;
  bestPaceFormatted?: string;
  elevationGainM: number;
  elevationLossM?: number;
  calories: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgCadence?: number;
  locationLabel?: string;
  routePolylinePoints?: Array<{ lat: number; lng: number; ele?: number }>;
  splits?: FeedSplitItem[];
}

export interface FeedPost {
  id: string;
  type: FeedActivityType;
  title: string;
  subtitle?: string;
  date: string; // YYYY-MM-DD
  timeFormatted: string; // HH:mm
  timestamp: number;
  userName: string;
  userAvatar?: string;
  userNote?: string;
  workoutSummary?: FeedWorkoutSummary;
  runningSummary?: FeedRunningSummary;
  kudosCount: number;
  hasUserKudoed?: boolean;
  commentsCount?: number;
  createdAt: string;
}

export type FeedFilterType = 'all' | 'workout' | 'running';
