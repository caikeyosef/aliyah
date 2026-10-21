import { FeedPost, FeedWorkoutSummary, FeedRunningSummary, FeedExerciseItem } from '../types/feed';
import { WorkoutSession } from '../types/fitness';
import { GPXActivity } from '../types/running';

export const FEED_STORAGE_KEY = 'fitmorph_feed_posts';

export function getStoredFeedPosts(): FeedPost[] {
  try {
    const raw = localStorage.getItem(FEED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler posts do feed', e);
  }
  return [];
}

export function saveStoredFeedPosts(posts: FeedPost[]): void {
  try {
    localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error('Erro ao salvar posts do feed', e);
  }
}

// Convert WorkoutSession to FeedPost
export function buildWorkoutFeedPost(workout: WorkoutSession, userName: string = 'Atleta Aliyah'): FeedPost {
  const muscleGroupsSet = new Set<string>();

  const exercises: FeedExerciseItem[] = workout.exercises.map((ex) => {
    if (ex.muscleGroup) muscleGroupsSet.add(ex.muscleGroup);

    const completedSets = ex.sets.filter((s) => s.completed || s.weightKg > 0);
    const setsCount = completedSets.length > 0 ? completedSets.length : ex.sets.length;
    const totalReps = completedSets.reduce((acc, s) => acc + (s.reps || 0), 0);
    const maxWeightKg = completedSets.length > 0
      ? Math.max(...completedSets.map((s) => s.weightKg || 0))
      : 0;

    const volumeKg = completedSets.reduce((acc, s) => acc + (s.weightKg || 0) * (s.reps || 0), 0);
    const setsDetail = completedSets.map((s) => `${s.weightKg}kg × ${s.reps}`).join(' • ');

    return {
      id: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      setsCount,
      totalReps,
      maxWeightKg,
      volumeKg,
      setsDetail: setsDetail || `${setsCount} séries`,
      isPr: !!ex.pr && maxWeightKg >= ex.pr,
    };
  });

  const totalVolumeKg = exercises.reduce((acc, e) => acc + e.volumeKg, 0);
  const totalSets = exercises.reduce((acc, e) => acc + e.setsCount, 0);
  const totalReps = exercises.reduce((acc, e) => acc + e.totalReps, 0);

  // Extract PRs
  const prsAchieved = exercises
    .filter((e) => e.isPr && e.maxWeightKg > 0)
    .map((e) => `${e.name}: ${e.maxWeightKg} kg`);

  const workoutSummary: FeedWorkoutSummary = {
    workoutId: workout.id,
    templateId: workout.templateId,
    name: workout.name || 'Treino de Força',
    muscleGroups: Array.from(muscleGroupsSet),
    totalVolumeKg,
    totalSets,
    totalReps,
    durationMinutes: workout.durationMinutes || 45,
    caloriesBurned: workout.estimatedCaloriesBurned || Math.round((workout.durationMinutes || 45) * 6.5),
    exercises,
    prsAchieved: prsAchieved.length > 0 ? prsAchieved : undefined,
  };

  const now = new Date();
  const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return {
    id: `post-workout-${workout.id}`,
    type: 'workout',
    title: workout.name || 'Treino de Força Concluído',
    subtitle: muscleGroupsSet.size > 0 ? Array.from(muscleGroupsSet).join(' • ') : 'Musculação & Hipertrofia',
    date: workout.date || now.toISOString().slice(0, 10),
    timeFormatted,
    timestamp: workout.date ? new Date(`${workout.date}T12:00:00`).getTime() : now.getTime(),
    userName: userName || 'Atleta Aliyah',
    userNote: workout.notes,
    workoutSummary,
    kudosCount: 1,
    hasUserKudoed: true,
    createdAt: new Date().toISOString(),
  };
}

// Convert GPXActivity to FeedPost
export function buildRunningFeedPost(activity: GPXActivity, userName: string = 'Atleta Aliyah'): FeedPost {
  const pointsSample = activity.points && activity.points.length > 0
    ? activity.points
        .filter((_, idx) => idx % Math.max(1, Math.floor(activity.points.length / 120)) === 0)
        .map((p) => ({ lat: p.lat, lng: p.lon, ele: p.ele }))
    : [];

  const splits = activity.splits?.slice(0, 15).map((s) => ({
    km: s.km,
    paceFormatted: s.paceFormatted,
    elevationDiffM: s.elevationDiffM,
    isFastest: s.isFastest,
  })) || [];

  const runningSummary: FeedRunningSummary = {
    activityId: activity.id,
    title: activity.title || 'Corrida de Rua',
    filename: activity.filename,
    distanceKm: activity.totalDistanceKm,
    durationSeconds: activity.movingTimeSeconds || activity.totalTimeSeconds,
    movingTimeFormatted: formatSecondsToTime(activity.movingTimeSeconds || activity.totalTimeSeconds),
    avgPaceFormatted: activity.movingPaceFormatted || '5:30 /km',
    bestPaceFormatted: activity.bestPaceFormatted,
    elevationGainM: activity.elevationGainM || 0,
    elevationLossM: activity.elevationLossM,
    calories: activity.estimatedCalories || Math.round(activity.totalDistanceKm * 68),
    avgHeartRate: activity.avgHeartRate,
    maxHeartRate: activity.maxHeartRate,
    avgCadence: activity.avgCadence,
    routePolylinePoints: pointsSample,
    splits,
  };

  const now = new Date();
  const timeFormatted = activity.startTimeFormatted || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return {
    id: `post-running-${activity.id}`,
    type: 'running_gpx',
    title: activity.title || 'Corrida de Rua',
    subtitle: `Treino de ${activity.totalDistanceKm.toFixed(2)} km`,
    date: activity.date || now.toISOString().slice(0, 10),
    timeFormatted,
    timestamp: activity.date ? new Date(`${activity.date}T12:00:00`).getTime() : now.getTime(),
    userName: userName || 'Atleta Aliyah',
    userNote: activity.description,
    runningSummary,
    kudosCount: 1,
    hasUserKudoed: true,
    createdAt: activity.savedAt || new Date().toISOString(),
  };
}

function formatSecondsToTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

// Synchronize Feed with saved workouts and runs
export function syncFeedWithActivities(
  existingPosts: FeedPost[],
  workouts: WorkoutSession[],
  runs: GPXActivity[],
  userName: string = 'Atleta Aliyah'
): FeedPost[] {
  const postMap = new Map<string, FeedPost>();
  existingPosts.forEach((p) => postMap.set(p.id, p));

  let hasChanges = false;

  // Sync finished workouts
  workouts.forEach((w) => {
    if (w.completed) {
      const postId = `post-workout-${w.id}`;
      if (!postMap.has(postId)) {
        const newPost = buildWorkoutFeedPost(w, userName);
        postMap.set(postId, newPost);
        hasChanges = true;
      }
    }
  });

  // Sync saved runs
  runs.forEach((r) => {
    const postId = `post-running-${r.id}`;
    if (!postMap.has(postId)) {
      const newPost = buildRunningFeedPost(r, userName);
      postMap.set(postId, newPost);
      hasChanges = true;
    }
  });

  const merged = Array.from(postMap.values()).sort((a, b) => {
    return b.timestamp - a.timestamp;
  });

  if (hasChanges || existingPosts.length !== merged.length) {
    saveStoredFeedPosts(merged);
  }

  return merged;
}

// Toggle Kudos
export function togglePostKudos(posts: FeedPost[], postId: string): FeedPost[] {
  const updated = posts.map((p) => {
    if (p.id !== postId) return p;
    const wasKudoed = !!p.hasUserKudoed;
    return {
      ...p,
      hasUserKudoed: !wasKudoed,
      kudosCount: wasKudoed ? Math.max(0, p.kudosCount - 1) : p.kudosCount + 1,
    };
  });
  saveStoredFeedPosts(updated);
  return updated;
}

// Update Post Note or Title
export function updatePostDetails(
  posts: FeedPost[],
  postId: string,
  newTitle: string,
  newNote?: string
): FeedPost[] {
  const updated = posts.map((p) => {
    if (p.id !== postId) return p;
    return {
      ...p,
      title: newTitle.trim() || p.title,
      userNote: newNote !== undefined ? newNote.trim() : p.userNote,
    };
  });
  saveStoredFeedPosts(updated);
  return updated;
}

// Delete Post
export function deletePostFromFeed(posts: FeedPost[], postId: string): FeedPost[] {
  const updated = posts.filter((p) => p.id !== postId);
  saveStoredFeedPosts(updated);
  return updated;
}
