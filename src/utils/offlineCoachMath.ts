/**
 * Aliyah - Consultor Matemático & Diagnóstico Esportivo Offline
 * Substitui chamadas de IA por modelos matemáticos e regras de fisiologia do exercício 100% offline.
 */

import { UserProfile, AICoachFeedback, FoodLogItem, WorkoutSession } from '../types/fitness';

interface GenerateCoachMetricsParams {
  profile: UserProfile;
  foodLogs: FoodLogItem[];
  workouts: WorkoutSession[];
  waterLoggedMl?: number;
}

export function generateMathematicalCoachFeedback({
  profile,
  foodLogs,
  workouts,
  waterLoggedMl = 0,
}: GenerateCoachMetricsParams): AICoachFeedback {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFoods = foodLogs.filter((f) => f.date === todayStr);
  const totalCalsToday = todayFoods.reduce((acc, cur) => acc + cur.calories, 0);
  const totalProtToday = todayFoods.reduce((acc, cur) => acc + cur.protein, 0);

  const calorieBudget = profile.hasActiveGoal ? profile.targetCalories : profile.tdee;
  const calorieDiff = totalCalsToday - calorieBudget;
  const protTarget = profile.targetProtein || Math.round(profile.currentWeight * 2);
  const protRatio = protTarget > 0 ? (totalProtToday / protTarget) * 100 : 0;
  const waterTarget = profile.targetWater || Math.round(profile.currentWeight * 35);
  const waterRatio = waterTarget > 0 ? (waterLoggedMl / waterTarget) * 100 : 0;

  // Recent 7 days workouts
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentWorkoutsCount = workouts.filter((w) => new Date(w.date) >= sevenDaysAgo).length;

  // Diagnóstico Matemático
  let diagnostico = '';
  if (!profile.hasActiveGoal) {
    diagnostico = `Operando em Modo Livre Matemático. Seu gasto energético basal diário (TDEE) está calibrado em ${profile.tdee} kcal. Hoje você registrou ${totalCalsToday} kcal e ${recentWorkoutsCount} treinos nos últimos 7 dias.`;
  } else if (profile.goal === 'lose_weight') {
    const dailyDeficit = profile.tdee - (totalCalsToday > 0 ? totalCalsToday : profile.targetCalories);
    const weeklyFatLossKg = ((dailyDeficit * 7) / 7700).toFixed(2);
    diagnostico = `Foco em Perda de Gordura: Com déficit planejado de ${Math.abs(profile.calorieAdjustment)} kcal/dia, a taxa matemática de oxidação lipídica projeta -${weeklyFatLossKg} kg de gordura corporal por semana.`;
  } else if (profile.goal === 'gain_weight') {
    const weeklySurplus = ((profile.calorieAdjustment * 7) / 7700).toFixed(2);
    diagnostico = `Foco em Hipertrofia & Massa Magra: Superávit energético de +${profile.calorieAdjustment} kcal/dia garantindo síntese proteica ótima e progressão contínua com ganho previsto de +${weeklySurplus} kg/semana.`;
  } else {
    diagnostico = `Foco em Manutenção & Recomposição: Equilíbrio calórico em ${profile.targetCalories} kcal/dia com alta densidade de nutrientes e preservação máxima de massa magra.`;
  }

  // 3 Dicas Práticas Baseadas em Números Reais
  const dicasPraticas: string[] = [];

  // Dica 1: Proteína
  if (totalProtToday > 0 && protRatio < 70) {
    dicasPraticas.push(
      `Proteína em ${totalProtToday}g (${protRatio.toFixed(0)}% da meta de ${protTarget}g). Adicione uma fonte proteica magra (frango, ovos ou whey) na próxima refeição para manter a síntese muscular.`
    );
  } else if (totalProtToday >= protTarget) {
    dicasPraticas.push(
      `Meta de proteína atingida com precisão (${totalProtToday}g / ${protTarget}g)! Excelente suporte para recuperação e preservação metabólica.`
    );
  } else {
    dicasPraticas.push(
      `Meta proteica diária calculada em ${protTarget}g (~${(protTarget / profile.currentWeight).toFixed(1)}g/kg). Priorize proteínas de alto valor biológico em cada refeição.`
    );
  }

  // Dica 2: Hidratação
  if (waterLoggedMl > 0 && waterRatio < 60) {
    dicasPraticas.push(
      `Hidratação atual em ${waterLoggedMl} ml (${waterRatio.toFixed(0)}% da meta de ${waterTarget} ml). A desidratação de apenas 2% reduz o rendimento de força e a síntese proteica em até 15%.`
    );
  } else {
    dicasPraticas.push(
      `Meta de hidratação: ${waterTarget} ml/dia calculada pela taxa fisiológica de 35 a 40 ml por kg de peso corporal.`
    );
  }

  // Dica 3: Treino & Cargas
  if (recentWorkoutsCount >= 3) {
    dicasPraticas.push(
      `Consistência excelente nos treinos: ${recentWorkoutsCount} sessões nos últimos 7 dias. Mantenha a sobrecarga progressiva anotando os pesos para sinalizar hipertrofia contínua.`
    );
  } else {
    dicasPraticas.push(
      `Frequência semanal: registre suas cargas em cada exercício das fichas para alimentar a memória muscular e visualizar sua curva de progressão de força.`
    );
  }

  // Motivação Científica
  const motivacao =
    'O corpo humano responde estritamente às leis da termodinâmica e da adaptação fisiológica. Constância matemática diária supera picos esporádicos de intensidade.';

  // Projeção Matemática
  const targetDays = profile.targetDays || 60;
  const totalChangeKg = profile.projectedWeightChangeKg || 0;
  const projecaoConselho =
    profile.hasActiveGoal && totalChangeKg !== 0
      ? `Em ${targetDays} dias com déficit de ${Math.abs(profile.calorieAdjustment)} kcal/dia, o déficit acumulado de ${(Math.abs(profile.calorieAdjustment) * targetDays).toLocaleString('pt-BR')} kcal equivale matematicamente a ${Math.abs(totalChangeKg)} kg de variação corporal total.`
      : `Metabolismo basal estimado em ${profile.bmr} kcal/dia e gasto diário de ${profile.tdee} kcal/dia.`;

  return {
    diagnostico,
    dicasPraticas,
    motivacao,
    projecaoConselho,
    updatedAt: new Date().toISOString(),
  };
}
