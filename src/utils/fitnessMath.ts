import { ActivityLevel, FitnessGoal, GoalIntensity, Gender, UserProfile } from '../types/fitness';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, { title: string; desc: string }> = {
  sedentary: {
    title: 'Sedentário',
    desc: 'Pouco ou nenhum exercício, trabalho sentado (ex: escritório/home-office)',
  },
  light: {
    title: 'Levemente Ativo',
    desc: 'Exercícios leves ou caminhadas 1 a 3 dias por semana',
  },
  moderate: {
    title: 'Moderadamente Ativo',
    desc: 'Treinos de musculação/esporte de 3 a 5 dias por semana',
  },
  very_active: {
    title: 'Muito Ativo',
    desc: 'Treinos intensos de 6 a 7 dias por semana',
  },
  extra_active: {
    title: 'Extremamente Ativo',
    desc: 'Atleta, treinos 2x ao dia ou trabalho braçal pesado',
  },
};

export const GOAL_LABELS: Record<FitnessGoal, { title: string; desc: string; badge: string }> = {
  none: {
    title: 'Modo Livre / Sem Meta Fixa',
    desc: 'Rastreie treinos, cargas e peso livremente sem obrigação de déficit calórico',
    badge: 'Modo Livre',
  },
  lose_weight: {
    title: 'Emagrecer & Queimar Gordura',
    desc: 'Déficit calórico estratégico preservando massa muscular magra',
    badge: 'Déficit Calórico',
  },
  gain_weight: {
    title: 'Ganhar Peso & Hipertrofia',
    desc: 'Superávit calórico limpo para ganho de massa muscular e força',
    badge: 'Superávit Calórico',
  },
  recomp: {
    title: 'Recomposição Corporal',
    desc: 'Queimar gordura localizada e tonificar músculos simultaneamente',
    badge: 'Recomp Inteligente',
  },
  maintain: {
    title: 'Manter Peso & Performance',
    desc: 'Equilíbrio calórico para manter peso atual, energia e vitalidade',
    badge: 'Manutenção',
  },
};

export function calculateBMR(gender: Gender, weight: number, height: number, age: number): number {
  // Fórmula Mifflin-St Jeor
  if (gender === 'male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375;
  return Math.round(bmr * multiplier);
}

export function getCalorieAdjustment(goal: FitnessGoal, intensity: GoalIntensity): number {
  switch (goal) {
    case 'lose_weight':
      if (intensity === 'mild') return -350;
      if (intensity === 'aggressive') return -750;
      return -500; // moderate
    case 'gain_weight':
      if (intensity === 'mild') return 250;
      if (intensity === 'aggressive') return 550;
      return 380; // moderate
    case 'recomp':
      if (intensity === 'mild') return -150;
      if (intensity === 'aggressive') return -300;
      return -200; // moderate
    case 'maintain':
    case 'none':
    default:
      return 0;
  }
}

export function calculateCompleteProfile(params: {
  name: string;
  gender: Gender;
  age: number;
  height: number;
  currentWeight: number;
  activityLevel: ActivityLevel;
  goal?: FitnessGoal;
  goalIntensity?: GoalIntensity;
  hasActiveGoal?: boolean;
  targetDays?: number;
  startDate?: string;
  targetDate?: string;
}): UserProfile {
  const {
    name,
    gender,
    age,
    height,
    currentWeight,
    activityLevel,
    goal = 'none',
    goalIntensity = 'moderate',
    hasActiveGoal = goal !== 'none',
  } = params;

  const bmr = calculateBMR(gender, currentWeight, height, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const calorieAdjustment = hasActiveGoal ? getCalorieAdjustment(goal, goalIntensity) : 0;

  // Meta diária mínima segura
  const minSafe = gender === 'female' ? 1200 : 1400;
  const targetCalories = hasActiveGoal
    ? Math.max(minSafe, Math.round(tdee + calorieAdjustment))
    : tdee;

  // Macronutrientes
  let proteinPerKg = 2.0;
  if (goal === 'gain_weight') proteinPerKg = 2.1;
  if (goal === 'maintain' || goal === 'none') proteinPerKg = 1.8;
  const targetProtein = Math.round(currentWeight * proteinPerKg);
  const targetFat = Math.round(currentWeight * 0.9);

  const caloriesFromProtein = targetProtein * 4;
  const caloriesFromFat = targetFat * 9;
  const remainingCalories = Math.max(0, targetCalories - (caloriesFromProtein + caloriesFromFat));
  const targetCarbs = Math.round(remainingCalories / 4);

  const targetWater = Math.round(currentWeight * 35);

  // Período em dias exatos (pode ser 45, 60, 75, etc.)
  const targetDays = params.targetDays && params.targetDays > 0 ? params.targetDays : 60;

  // Projeção matemática: ~7700 kcal por 1kg de gordura
  const totalCalorieDelta = calorieAdjustment * targetDays;
  const projectedWeightChangeKg = hasActiveGoal
    ? Number((totalCalorieDelta / 7700).toFixed(1))
    : 0;
  const projectedFinalWeight = Number((currentWeight + projectedWeightChangeKg).toFixed(1));

  // Datas
  const now = new Date();
  const startDate = params.startDate || now.toISOString().split('T')[0];

  let targetDate = params.targetDate;
  if (!targetDate) {
    const targetDateObj = new Date(startDate);
    targetDateObj.setDate(targetDateObj.getDate() + targetDays);
    targetDate = targetDateObj.toISOString().split('T')[0];
  }

  return {
    name: name || 'Atleta FitMorph',
    gender,
    age,
    height,
    currentWeight,
    startWeight: currentWeight,
    targetWeight: projectedFinalWeight,
    activityLevel,
    goal,
    goalIntensity,
    hasActiveGoal,
    targetDays,
    startDate,
    targetDate,
    bmr,
    tdee,
    calorieAdjustment,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    targetWater,
    projectedWeightChangeKg,
    projectedFinalWeight,
  };
}

export interface ProjectionWeekPoint {
  day: number;
  dateStr: string;
  projectedWeight: number;
  totalChangeKg: number;
}

export function generateWeightProjection(profile: UserProfile): ProjectionWeekPoint[] {
  const points: ProjectionWeekPoint[] = [];
  const totalDays = Math.max(1, profile.targetDays || 60);

  // Divide into approximately 8-12 sample points across exact days
  const stepDays = Math.max(1, Math.round(totalDays / 8));
  const dailyChange = profile.projectedWeightChangeKg / totalDays;
  const startDate = new Date(profile.startDate || new Date());

  for (let day = 0; day <= totalDays; day += stepDays) {
    const curDate = new Date(startDate);
    curDate.setDate(curDate.getDate() + day);

    const projectedWeight = Number((profile.startWeight + dailyChange * day).toFixed(1));
    const totalChangeKg = Number((dailyChange * day).toFixed(1));

    points.push({
      day,
      dateStr: curDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      projectedWeight,
      totalChangeKg,
    });
  }

  // Ensure last exact day is included
  const lastPoint = points[points.length - 1];
  if (lastPoint && lastPoint.day !== totalDays) {
    const finalDate = new Date(startDate);
    finalDate.setDate(finalDate.getDate() + totalDays);
    points.push({
      day: totalDays,
      dateStr: finalDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      projectedWeight: profile.projectedFinalWeight,
      totalChangeKg: profile.projectedWeightChangeKg,
    });
  }

  return points;
}
