/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  FoodLogItem,
  WorkoutTemplate,
  WorkoutSession,
  WeightLog,
  ProgressPhoto,
  AICoachFeedback,
  HabitItem,
} from './types/fitness';
import {
  getStoredProfile,
  saveStoredProfile,
  getStoredFoodLogs,
  saveStoredFoodLogs,
  getStoredWorkoutTemplates,
  saveStoredWorkoutTemplates,
  getStoredWorkouts,
  saveStoredWorkouts,
  getStoredWeightLogs,
  saveStoredWeightLogs,
  getStoredPhotos,
  saveStoredPhotos,
  getStoredCoachFeedback,
  saveStoredCoachFeedback,
  getStoredHabits,
  saveStoredHabits,
  INITIAL_HABITS,
  hasUserCompletedOnboarding,
  setHasUserCompletedOnboarding,
  DEFAULT_INITIAL_PROFILE,
  INITIAL_FOOD_LOGS,
  INITIAL_WORKOUT_TEMPLATES,
  INITIAL_WORKOUT_LOGS,
  INITIAL_WEIGHT_LOGS,
  INITIAL_PROGRESS_PHOTOS,
  DEFAULT_COACH_FEEDBACK,
  clearAllStoredData,
  getTodayDateStr,
} from './utils/storage';
import { calculateCompleteProfile } from './utils/fitnessMath';
import { Navbar, TabType } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { NutritionTab } from './components/NutritionTab';
import { HydrationTab } from './components/HydrationTab';
import { WorkoutsTab } from './components/WorkoutsTab';
import { HabitsTab } from './components/HabitsTab';
import { ProgressChartsTab } from './components/ProgressChartsTab';
import { PhotoCompareTab } from './components/PhotoCompareTab';
import { ProfileGoalTab } from './components/ProfileGoalTab';
import { OnboardingModal } from './components/OnboardingModal';
import { SetGoalModal } from './components/SetGoalModal';
import { FoodCalculatorModal } from './components/FoodCalculatorModal';
import { DataBackupModal } from './components/DataBackupModal';
import { AliyahBackupPayload } from './utils/backup';
import { RotateCcw, ArrowUp, Database } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [foodLogs, setFoodLogs] = useState<FoodLogItem[]>(getStoredFoodLogs);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>(getStoredWorkoutTemplates);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>(getStoredWorkouts);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(getStoredWeightLogs);
  const [photos, setPhotos] = useState<ProgressPhoto[]>(getStoredPhotos);
  const [coachFeedback, setCoachFeedback] = useState<AICoachFeedback>(getStoredCoachFeedback);
  const [habits, setHabits] = useState<HabitItem[]>(getStoredHabits);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => !hasUserCompletedOnboarding());
  const [isSetGoalModalOpen, setIsSetGoalModalOpen] = useState<boolean>(false);
  const [isFoodCalculatorOpen, setIsFoodCalculatorOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [onboardingKey, setOnboardingKey] = useState<number>(1);
  const [resetToastMessage, setResetToastMessage] = useState<string | null>(null);

  // Sync state changes to localStorage
  useEffect(() => {
    saveStoredProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveStoredFoodLogs(foodLogs);
  }, [foodLogs]);

  useEffect(() => {
    saveStoredWorkoutTemplates(workoutTemplates);
  }, [workoutTemplates]);

  useEffect(() => {
    saveStoredWorkouts(workouts);
  }, [workouts]);

  useEffect(() => {
    saveStoredWeightLogs(weightLogs);
  }, [weightLogs]);

  useEffect(() => {
    saveStoredPhotos(photos);
  }, [photos]);

  useEffect(() => {
    saveStoredCoachFeedback(coachFeedback);
  }, [coachFeedback]);

  useEffect(() => {
    saveStoredHabits(habits);
  }, [habits]);

  // Handlers
  const handleOnboardingComplete = (newProfile: UserProfile) => {
    const todayStr = getTodayDateStr();
    const informedWeight = newProfile.currentWeight;

    const finalizedProfile: UserProfile = {
      ...newProfile,
      startWeight: informedWeight,
      currentWeight: informedWeight,
      startDate: todayStr,
    };

    setProfile(finalizedProfile);
    saveStoredProfile(finalizedProfile);
    setHasUserCompletedOnboarding(true);
    setIsOnboardingOpen(false);

    // Initial reference weigh-in is strictly the informed weight on this exact day!
    const initialLog: WeightLog = {
      id: 'wl-initial-ref-' + Date.now(),
      date: todayStr,
      weightKg: informedWeight,
      notes: 'Pesagem Inicial de Referência (Cadastro Inicial)',
    };

    setWeightLogs([initialLog]);
    saveStoredWeightLogs([initialLog]);
  };

  const handleSaveWorkoutTemplate = (template: WorkoutTemplate) => {
    setWorkoutTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === template.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = template;
        return copy;
      }
      return [template, ...prev];
    });
  };

  const handleDeleteWorkoutTemplate = (id: string) => {
    setWorkoutTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveWorkout = (session: WorkoutSession) => {
    setWorkouts((prev) => {
      const idx = prev.findIndex((w) => w.id === session.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = session;
        return copy;
      }
      return [session, ...prev];
    });
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const handleAddFood = (newItem: Omit<FoodLogItem, 'id' | 'createdAt'>) => {
    const item: FoodLogItem = {
      ...newItem,
      id: 'food-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setFoodLogs((prev) => [item, ...prev]);
  };

  const handleDeleteFood = (id: string) => {
    setFoodLogs((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddWeight = (weight: number, date: string, notes?: string) => {
    const newLog: WeightLog = {
      id: 'wl-' + Date.now(),
      date,
      weightKg: weight,
      notes: notes || 'Pesagem registrada',
    };

    setWeightLogs((prev) => {
      const filtered = prev.filter((w) => w.date !== date);
      return [...filtered, newLog];
    });

    const updated = calculateCompleteProfile({
      name: profile.name,
      gender: profile.gender,
      age: profile.age,
      height: profile.height,
      currentWeight: weight,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
      goalIntensity: profile.goalIntensity,
      hasActiveGoal: profile.hasActiveGoal,
      targetDays: profile.targetDays,
      startDate: profile.startDate,
    });
    setProfile(updated);
  };

  const handleDeleteWeight = (id: string) => {
    setWeightLogs((prev) => prev.filter((w) => w.id !== id));
  };

  const handleAddPhoto = (newPhoto: Omit<ProgressPhoto, 'id'>) => {
    const photo: ProgressPhoto = {
      ...newPhoto,
      id: 'photo-' + Date.now(),
    };
    setPhotos((prev) => [photo, ...prev]);
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddHabit = (
    newHabit: Omit<HabitItem, 'id' | 'createdAt' | 'completedDates'>
  ) => {
    const item: HabitItem = {
      ...newHabit,
      id: 'habit-' + Date.now(),
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    setHabits((prev) => [item, ...prev]);
  };

  const handleUpdateHabit = (updated: HabitItem) => {
    setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
  };

  const handleDeleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const handleToggleHabitDate = (habitId: string, dateStr: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const already = h.completedDates.includes(dateStr);
        return {
          ...h,
          completedDates: already
            ? h.completedDates.filter((d) => d !== dateStr)
            : [...h.completedDates, dateStr],
        };
      })
    );
  };

  const handleUpdateTargetDays = (days: number) => {
    const updated = calculateCompleteProfile({
      name: profile.name,
      gender: profile.gender,
      age: profile.age,
      height: profile.height,
      currentWeight: profile.currentWeight,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
      goalIntensity: profile.goalIntensity,
      hasActiveGoal: profile.hasActiveGoal,
      targetDays: days,
      startDate: profile.startDate,
    });
    setProfile(updated);
  };

  const handleUpdateTargetWater = (newWaterTarget: number) => {
    setProfile((prev) => ({
      ...prev,
      targetWater: newWaterTarget,
    }));
  };

  const handleSaveGoal = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  const handleResetData = () => {
    // 1. Clear storage completely
    clearAllStoredData();
    localStorage.clear();
    setHasUserCompletedOnboarding(false);

    // 2. Clean fresh states
    setProfile(DEFAULT_INITIAL_PROFILE);
    setFoodLogs(INITIAL_FOOD_LOGS);
    setWorkoutTemplates(INITIAL_WORKOUT_TEMPLATES);
    setWorkouts(INITIAL_WORKOUT_LOGS);
    setWeightLogs(INITIAL_WEIGHT_LOGS);
    setPhotos(INITIAL_PROGRESS_PHOTOS);
    setCoachFeedback(DEFAULT_COACH_FEEDBACK);
    setHabits(INITIAL_HABITS);

    // 3. Close confirmation modal
    setIsResetModalOpen(false);

    // 4. Force fresh remount of onboarding modal and open it immediately
    setOnboardingKey((k) => k + 1);
    setIsOnboardingOpen(true);
    setActiveTab('dashboard');

    // 5. Toast
    setResetToastMessage('Aplicativo zerado com sucesso! Preencha seu cadastro inicial.');
    setTimeout(() => setResetToastMessage(null), 4000);
  };

  const handleDataRestored = (restoredData: AliyahBackupPayload['data']) => {
    if (restoredData?.profile) setProfile(restoredData.profile);
    if (restoredData?.foodLogs) setFoodLogs(restoredData.foodLogs);
    if (restoredData?.workoutTemplates) setWorkoutTemplates(restoredData.workoutTemplates);
    if (restoredData?.workoutLogs) setWorkouts(restoredData.workoutLogs);
    if (restoredData?.weightLogs) setWeightLogs(restoredData.weightLogs);
    if (restoredData?.progressPhotos) setPhotos(restoredData.progressPhotos);
    if (restoredData?.coachFeedback) setCoachFeedback(restoredData.coachFeedback);
    if (restoredData?.habits) setHabits(restoredData.habits);

    setIsBackupModalOpen(false);
    setResetToastMessage('Backup e dados restaurados com sucesso!');
    setTimeout(() => setResetToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#060c19] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenFoodCalculator={() => setIsFoodCalculatorOpen(true)}
        onOpenResetConfirm={() => setIsResetModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        targetDays={profile.targetDays}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8 lg:pb-10">
        {activeTab === 'dashboard' && (
          <DashboardTab
            profile={profile}
            foodLogs={foodLogs}
            workouts={workouts}
            weightLogs={weightLogs}
            coachFeedback={coachFeedback}
            habits={habits}
            onNavigateTab={setActiveTab}
            onOpenSetGoalModal={() => setIsSetGoalModalOpen(true)}
            onUpdateCoachFeedback={setCoachFeedback}
          />
        )}

        {activeTab === 'nutrition' && (
          <NutritionTab
            profile={profile}
            foodLogs={foodLogs}
            onAddFood={handleAddFood}
            onDeleteFood={handleDeleteFood}
            targetWater={profile.targetWater}
            onNavigateToHydration={() => setActiveTab('hydration')}
          />
        )}

        {activeTab === 'hydration' && (
          <HydrationTab
            targetWaterMl={profile.targetWater}
            onUpdateTargetWater={handleUpdateTargetWater}
          />
        )}

        {activeTab === 'workouts' && (
          <WorkoutsTab
            workoutTemplates={workoutTemplates}
            onSaveWorkoutTemplate={handleSaveWorkoutTemplate}
            onDeleteWorkoutTemplate={handleDeleteWorkoutTemplate}
            workouts={workouts}
            onSaveWorkout={handleSaveWorkout}
            onDeleteWorkout={handleDeleteWorkout}
          />
        )}

        {activeTab === 'habits' && (
          <HabitsTab
            habits={habits}
            onAddHabit={handleAddHabit}
            onUpdateHabit={handleUpdateHabit}
            onDeleteHabit={handleDeleteHabit}
            onToggleHabitDate={handleToggleHabitDate}
          />
        )}

        {activeTab === 'charts' && (
          <ProgressChartsTab
            profile={profile}
            weightLogs={weightLogs}
            onAddWeight={handleAddWeight}
            onDeleteWeight={handleDeleteWeight}
            onUpdateTargetDays={handleUpdateTargetDays}
            onOpenSetGoalModal={() => setIsSetGoalModalOpen(true)}
          />
        )}

        {activeTab === 'photos' && (
          <PhotoCompareTab
            photos={photos}
            currentWeight={profile.currentWeight}
            onAddPhoto={handleAddPhoto}
            onDeletePhoto={handleDeletePhoto}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileGoalTab
            profile={profile}
            onOpenEditProfile={() => setIsOnboardingOpen(true)}
            onOpenSetGoalModal={() => setIsSetGoalModalOpen(true)}
            onResetData={() => setIsResetModalOpen(true)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
          />
        )}
      </main>

      {/* Footer - Optimized for mobile with clearance above fixed dock and balanced layout */}
      <footer className="border-t border-[#121f3d] bg-[#050a17] pt-6 pb-28 lg:pb-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent font-heading text-sm">
                Aliyah
              </span>
              <span className="text-amber-400 font-serif font-bold text-xs" dir="rtl">
                עלייה
              </span>
            </div>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-slate-400 tracking-wider text-[11px] sm:text-xs uppercase font-medium">
              EVOLUÇÃO • TRANSFORMAÇÃO • BEM-ESTAR
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-1 sm:pt-0">
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" /> Backup
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" /> Topo
            </button>
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Zerar Dados
            </button>
          </div>
        </div>
      </footer>

      {/* Initial Onboarding Modal (Step 1 Basic stats -> sets reference weight & date) */}
      <OnboardingModal
        key={onboardingKey}
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
        onClose={hasUserCompletedOnboarding() ? () => setIsOnboardingOpen(false) : undefined}
        initialProfile={profile}
      />

      {/* Goal & Exact Days Plan Modal */}
      <SetGoalModal
        isOpen={isSetGoalModalOpen}
        onClose={() => setIsSetGoalModalOpen(false)}
        profile={profile}
        onSaveGoal={handleSaveGoal}
      />

      {/* Modal de Tabela de Alimentos & Calculadora Offline */}
      <FoodCalculatorModal
        isOpen={isFoodCalculatorOpen}
        onClose={() => setIsFoodCalculatorOpen(false)}
        onAddFood={handleAddFood}
        defaultMealType="lunch"
      />

      {/* GLOBAL RESET CONFIRMATION MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03060f]/85 backdrop-blur-md safe-area-top safe-area-bottom">
          <div className="relative w-full max-w-md bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <RotateCcw className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white">
                Zerar tudo e voltar ao cadastro inicial?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Esta ação apagará todas as fichas de treino criadas, histórico de cargas, refeições registradas, registros de hidratação e pesagens. O aplicativo retornará à <strong className="text-amber-300 font-semibold">tela inicial de cadastro</strong> para você preencher seu peso, altura, idade e dados básicos novamente.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-[#1b2d55] bg-[#0e1b36] hover:bg-[#15274e] text-slate-200 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Sim, Zerar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification - Gold/Reward */}
      {resetToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-4 py-3 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <span>✓</span> {resetToastMessage}
        </div>
      )}

      {/* Data Backup & Restore Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={handleDataRestored}
      />
    </div>
  );
}
