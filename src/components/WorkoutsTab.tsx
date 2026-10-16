import React, { useState, useEffect, useRef } from 'react';
import {
  WorkoutSession,
  WorkoutTemplate,
  WorkoutTemplateExercise,
  WorkoutExercise,
  ExerciseSet,
} from '../types/fitness';
import {
  Dumbbell,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Trophy,
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
  RotateCcw,
  Sparkles,
  TrendingUp,
  X,
  Edit2,
  History,
  Check,
} from 'lucide-react';

interface WorkoutsTabProps {
  workoutTemplates: WorkoutTemplate[];
  onSaveWorkoutTemplate: (template: WorkoutTemplate) => void;
  onDeleteWorkoutTemplate: (id: string) => void;
  workouts: WorkoutSession[];
  onSaveWorkout: (workout: WorkoutSession) => void;
  onDeleteWorkout: (id: string) => void;
}

export const WorkoutsTab: React.FC<WorkoutsTabProps> = ({
  workoutTemplates,
  onSaveWorkoutTemplate,
  onDeleteWorkoutTemplate,
  workouts,
  onSaveWorkout,
  onDeleteWorkout,
}) => {
  // Navigation sub-view inside workouts tab
  const [subView, setSubView] = useState<'fichas' | 'progression' | 'history'>('fichas');

  // Modal: Create / Edit Ficha de Treino
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateFocus, setTemplateFocus] = useState('');
  const [templateExercises, setTemplateExercises] = useState<WorkoutTemplateExercise[]>([]);

  // Exercise input inside Ficha modal
  const [tempExName, setTempExName] = useState('');
  const [tempExGroup, setTempExGroup] = useState<WorkoutTemplateExercise['muscleGroup']>('peito');
  const [tempExSets, setTempExSets] = useState(3);
  const [tempExReps, setTempExReps] = useState('8-12 reps');

  // Active workout session
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);

  // Rest Timer
  const [restSeconds, setRestSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Selected exercise for Progression View
  const [selectedProgressionExercise, setSelectedProgressionExercise] = useState<string | null>(null);

  // Start rest timer
  const startRestTimer = (seconds: number) => {
    setRestSeconds(seconds);
    setIsTimerRunning(true);
  };

  useEffect(() => {
    if (isTimerRunning && restSeconds > 0) {
      timerIntervalRef.current = setTimeout(() => {
        setRestSeconds((prev) => prev - 1);
      }, 1000);
    } else if (restSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        // Audio fallback
      }
    }

    return () => {
      if (timerIntervalRef.current) clearTimeout(timerIntervalRef.current);
    };
  }, [isTimerRunning, restSeconds]);

  // Open modal to create a new ficha
  const handleOpenCreateTemplate = () => {
    setEditingTemplateId(null);
    setTemplateName('');
    setTemplateFocus('');
    setTemplateExercises([]);
    setIsTemplateModalOpen(true);
  };

  // Open modal to edit existing ficha
  const handleOpenEditTemplate = (tmpl: WorkoutTemplate) => {
    setEditingTemplateId(tmpl.id);
    setTemplateName(tmpl.name);
    setTemplateFocus(tmpl.muscleFocus || '');
    setTemplateExercises([...tmpl.exercises]);
    setIsTemplateModalOpen(true);
  };

  // Add exercise into ficha draft
  const handleAddExerciseToTemplate = () => {
    if (!tempExName.trim()) return;
    const newEx: WorkoutTemplateExercise = {
      id: 'te-' + Date.now(),
      name: tempExName.trim(),
      muscleGroup: tempExGroup,
      defaultSets: Math.max(1, Number(tempExSets) || 3),
      targetReps: tempExReps.trim() || '8-12 reps',
      lastWeightKg: 0,
    };
    setTemplateExercises([...templateExercises, newEx]);
    setTempExName('');
    setTempExReps('8-12 reps');
  };

  const handleRemoveExerciseFromTemplate = (id: string) => {
    setTemplateExercises(templateExercises.filter((e) => e.id !== id));
  };

  // Save the ficha
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;

    const template: WorkoutTemplate = {
      id: editingTemplateId || 'tmpl-' + Date.now(),
      name: templateName.trim(),
      muscleFocus: templateFocus.trim() || undefined,
      exercises: templateExercises,
      createdAt: new Date().toISOString(),
    };

    onSaveWorkoutTemplate(template);
    setIsTemplateModalOpen(false);
  };

  // Start workout from a user-created ficha
  const handleStartFromTemplate = (template: WorkoutTemplate) => {
    // Find the latest loads used for each exercise from previous workout sessions
    const session: WorkoutSession = {
      id: 'w-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      templateId: template.id,
      name: template.name,
      durationMinutes: 50,
      estimatedCaloriesBurned: 350,
      completed: false,
      notes: '',
      exercises: template.exercises.map((tmplEx) => {
        // Look up previous weight recorded for this exercise
        const previousLoad = getLatestRecordedWeightForExercise(tmplEx.name);
        const weightToUse = previousLoad > 0 ? previousLoad : (tmplEx.lastWeightKg || 0);

        const sets: ExerciseSet[] = [];
        const count = tmplEx.defaultSets || 3;
        for (let i = 1; i <= count; i++) {
          sets.push({
            id: `s-${tmplEx.id}-${i}-${Date.now()}`,
            setNumber: i,
            weightKg: weightToUse,
            reps: 10,
            completed: false,
          });
        }

        return {
          id: 'ex-' + tmplEx.id + '-' + Date.now(),
          name: tmplEx.name,
          muscleGroup: tmplEx.muscleGroup,
          targetReps: tmplEx.targetReps,
          pr: getPRForExercise(tmplEx.name),
          sets,
        };
      }),
    };

    setActiveSession(session);
    setIsLiveActive(true);
  };

  // Start free blank workout
  const handleStartBlankWorkout = () => {
    const session: WorkoutSession = {
      id: 'w-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      name: 'Treino de Hoje',
      durationMinutes: 45,
      estimatedCaloriesBurned: 300,
      completed: false,
      notes: '',
      exercises: [],
    };
    setActiveSession(session);
    setIsLiveActive(true);
  };

  // Helper to find latest recorded weight for an exercise
  const getLatestRecordedWeightForExercise = (exerciseName: string): number => {
    const matchingSessions = [...workouts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const session of matchingSessions) {
      const match = session.exercises.find(
        (e) => e.name.trim().toLowerCase() === exerciseName.trim().toLowerCase()
      );
      if (match) {
        const completedSets = match.sets.filter((s) => s.completed || s.weightKg > 0);
        if (completedSets.length > 0) {
          return Math.max(...completedSets.map((s) => s.weightKg));
        }
      }
    }
    return 0;
  };

  // Helper to find absolute PR for an exercise
  const getPRForExercise = (exerciseName: string): number => {
    let pr = 0;
    for (const session of workouts) {
      const match = session.exercises.find(
        (e) => e.name.trim().toLowerCase() === exerciseName.trim().toLowerCase()
      );
      if (match) {
        for (const s of match.sets) {
          if (s.weightKg > pr) pr = s.weightKg;
        }
      }
    }
    return pr;
  };

  // Update set inside active workout
  const handleUpdateSet = (
    exId: string,
    setId: string,
    field: keyof ExerciseSet,
    value: any
  ) => {
    if (!activeSession) return;

    const updatedExercises = activeSession.exercises.map((ex) => {
      if (ex.id !== exId) return ex;

      const updatedSets = ex.sets.map((s) => {
        if (s.id !== setId) return s;
        return { ...s, [field]: value };
      });

      const maxWeight = Math.max(...updatedSets.map((s) => Number(s.weightKg) || 0), ex.pr || 0);

      return {
        ...ex,
        pr: maxWeight,
        sets: updatedSets,
      };
    });

    setActiveSession({
      ...activeSession,
      exercises: updatedExercises,
    });
  };

  const handleToggleSetCompleted = (exId: string, setId: string) => {
    if (!activeSession) return;
    const ex = activeSession.exercises.find((e) => e.id === exId);
    const setItem = ex?.sets.find((s) => s.id === setId);
    const willBeCompleted = !setItem?.completed;

    handleUpdateSet(exId, setId, 'completed', willBeCompleted);

    if (willBeCompleted) {
      startRestTimer(60);
    }
  };

  const handleAddSetToActiveExercise = (exId: string) => {
    if (!activeSession) return;
    const updated = activeSession.exercises.map((ex) => {
      if (ex.id !== exId) return ex;
      const last = ex.sets[ex.sets.length - 1];
      const newSet: ExerciseSet = {
        id: `s-${Date.now()}`,
        setNumber: ex.sets.length + 1,
        weightKg: last ? last.weightKg : 0,
        reps: last ? last.reps : 10,
        completed: false,
      };
      return { ...ex, sets: [...ex.sets, newSet] };
    });
    setActiveSession({ ...activeSession, exercises: updated });
  };

  const handleRemoveSetFromActiveExercise = (exId: string, setId: string) => {
    if (!activeSession) return;
    const updated = activeSession.exercises.map((ex) => {
      if (ex.id !== exId) return ex;
      return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
    });
    setActiveSession({ ...activeSession, exercises: updated });
  };

  // Add exercise to active session
  const [liveNewExName, setLiveNewExName] = useState('');
  const [liveNewExGroup, setLiveNewExGroup] = useState<WorkoutExercise['muscleGroup']>('peito');

  const handleAddExerciseToActiveSession = () => {
    if (!activeSession || !liveNewExName.trim()) return;
    const latestWeight = getLatestRecordedWeightForExercise(liveNewExName);

    const newEx: WorkoutExercise = {
      id: 'ex-' + Date.now(),
      name: liveNewExName.trim(),
      muscleGroup: liveNewExGroup,
      pr: getPRForExercise(liveNewExName),
      sets: [
        { id: `s-1-${Date.now()}`, setNumber: 1, weightKg: latestWeight, reps: 10, completed: false },
        { id: `s-2-${Date.now()}`, setNumber: 2, weightKg: latestWeight, reps: 10, completed: false },
        { id: `s-3-${Date.now()}`, setNumber: 3, weightKg: latestWeight, reps: 10, completed: false },
      ],
    };

    setActiveSession({
      ...activeSession,
      exercises: [...activeSession.exercises, newEx],
    });
    setLiveNewExName('');
  };

  // Finish and save workout
  const handleFinishWorkout = () => {
    if (!activeSession) return;

    const totalKg = activeSession.exercises.reduce((acc, ex) => {
      return (
        acc +
        ex.sets.reduce((sAcc, s) => {
          return s.completed ? sAcc + s.weightKg * s.reps : sAcc;
        }, 0)
      );
    }, 0);

    const finished: WorkoutSession = {
      ...activeSession,
      completed: true,
      notes: activeSession.notes
        ? `${activeSession.notes} (Volume: ${totalKg.toLocaleString('pt-BR')} kg)`
        : `Volume total levantado: ${totalKg.toLocaleString('pt-BR')} kg`,
    };

    onSaveWorkout(finished);

    // Also update lastWeightKg in matching template exercises so it persists
    if (activeSession.templateId) {
      const template = workoutTemplates.find((t) => t.id === activeSession.templateId);
      if (template) {
        const updatedTemplateExercises = template.exercises.map((tmplEx) => {
          const finishedEx = finished.exercises.find(
            (e) => e.name.trim().toLowerCase() === tmplEx.name.trim().toLowerCase()
          );
          if (finishedEx) {
            const max = Math.max(...finishedEx.sets.map((s) => s.weightKg));
            if (max > 0) {
              return { ...tmplEx, lastWeightKg: max };
            }
          }
          return tmplEx;
        });

        onSaveWorkoutTemplate({
          ...template,
          exercises: updatedTemplateExercises,
        });
      }
    }

    setIsLiveActive(false);
    setActiveSession(null);
    setIsTimerRunning(false);
  };

  // Compile list of unique exercises across all history for Progression View
  const allUniqueExercises = Array.from(
    new Set(
      workouts.flatMap((w) => w.exercises.map((e) => e.name.trim())).concat(
        workoutTemplates.flatMap((t) => t.exercises.map((e) => e.name.trim()))
      )
    )
  ).filter(Boolean);

  const activeProgressionExercise =
    selectedProgressionExercise || allUniqueExercises[0] || null;

  // Progression history for selected exercise
  const exerciseProgressionHistory = activeProgressionExercise
    ? workouts
        .filter((w) =>
          w.exercises.some(
            (e) => e.name.trim().toLowerCase() === activeProgressionExercise.toLowerCase()
          )
        )
        .map((w) => {
          const ex = w.exercises.find(
            (e) => e.name.trim().toLowerCase() === activeProgressionExercise.toLowerCase()
          )!;
          const maxWeight = Math.max(...ex.sets.map((s) => s.weightKg), 0);
          const totalReps = ex.sets.reduce((acc, s) => acc + (s.completed ? s.reps : 0), 0);
          return {
            date: w.date,
            workoutName: w.name,
            maxWeight,
            sets: ex.sets,
            totalReps,
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Rest Timer Floating Bar - Gold/Amber & Deep Navy */}
      {isTimerRunning && (
        <div className="sticky top-2 z-40 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 p-3.5 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 animate-spin" />
            <div>
              <div className="font-extrabold text-sm uppercase tracking-wide">
                Descanso Entre Séries
              </div>
              <div className="text-xs text-slate-950 font-medium">
                Recupere o fôlego antes da próxima repetição
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-black font-mono">
              00:{restSeconds < 10 ? `0${restSeconds}` : restSeconds}
            </span>
            <button
              onClick={() => setIsTimerRunning(false)}
              className="px-3 py-1 bg-black/30 hover:bg-black/50 text-white rounded-lg text-xs font-bold"
            >
              Pular
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE WORKOUT SCREEN */}
      {isLiveActive && activeSession ? (
        <div className="bg-[#0a142c] border border-[#a16207]/50 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1a2d56] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Sessão em Andamento
                </span>
              </div>
              <input
                type="text"
                value={activeSession.name}
                onChange={(e) => setActiveSession({ ...activeSession, name: e.target.value })}
                className="text-xl sm:text-2xl font-black text-white bg-transparent border-b border-transparent hover:border-[#1a2d56] focus:border-amber-400 focus:outline-none mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsLiveActive(false);
                  setActiveSession(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#122247] hover:bg-[#182f61] text-slate-300 text-xs font-semibold border border-[#1a2d56]"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinishWorkout}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Concluir Treino & Salvar Cargas
              </button>
            </div>
          </div>

          {/* Quick Rest Timer Shortcuts */}
          <div className="bg-[#060c19] p-3 rounded-2xl border border-[#17284f] flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" /> Descanso Rápido:
            </span>
            <div className="flex items-center gap-1.5">
              {[30, 45, 60, 90, 120].map((sec) => (
                <button
                  key={sec}
                  onClick={() => startRestTimer(sec)}
                  className="px-2.5 py-1 rounded-lg bg-[#122247] hover:bg-amber-400 hover:text-slate-950 text-slate-300 text-xs font-mono font-bold transition-all border border-[#1a2d56]"
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Exercises list */}
          <div className="space-y-5">
            {activeSession.exercises.map((ex, exIndex) => {
              const previousLoad = getLatestRecordedWeightForExercise(ex.name);

              return (
                <div
                  key={ex.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-emerald-400 text-xs font-bold flex items-center justify-center font-mono">
                        {exIndex + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {ex.name}
                          {ex.pr && ex.pr > 0 ? (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> PR: {ex.pr}kg
                            </span>
                          ) : null}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="capitalize">{ex.muscleGroup}</span>
                          {previousLoad > 0 && (
                            <span className="text-teal-400 font-mono">
                              • Carga anterior: {previousLoad} kg
                            </span>
                          )}
                          {ex.targetReps && <span>• Meta: {ex.targetReps}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddSetToActiveExercise(ex.id)}
                      className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-[#122247] hover:bg-[#182f61] text-amber-200 border border-[#a16207]/40 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" /> Adicionar Série
                    </button>
                  </div>

                  {/* Sets Table - 100% responsive, no horizontal scroll needed */}
                  <div className="w-full overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-[#17284f] pb-1">
                          <th className="py-1 px-1 sm:px-2 font-semibold w-10">Série</th>
                          <th className="py-1 px-1 sm:px-2 font-semibold">
                            <span className="hidden sm:inline">Carga Usada</span>
                            <span className="sm:hidden">Carga</span> (kg)
                          </th>
                          <th className="py-1 px-1 sm:px-2 font-semibold">
                            <span className="hidden sm:inline">Repetições</span>
                            <span className="sm:hidden">Reps</span>
                          </th>
                          <th className="py-1 px-1 sm:px-2 font-semibold text-center w-12">
                            <span className="hidden sm:inline">Concluído</span>
                            <span className="sm:hidden">Feito</span>
                          </th>
                          <th className="py-1 px-1 sm:px-2 text-right w-8">✕</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#17284f]/60">
                        {ex.sets.map((set) => (
                          <tr
                            key={set.id}
                            className={
                              set.completed
                                ? 'bg-amber-500/10 text-amber-200'
                                : 'text-slate-300'
                            }
                          >
                            <td className="py-2 px-1 sm:px-2 font-mono font-bold text-amber-400">
                              #{set.setNumber}
                            </td>
                            <td className="py-2 px-1 sm:px-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.5"
                                  placeholder="0"
                                  value={set.weightKg || ''}
                                  onChange={(e) =>
                                    handleUpdateSet(
                                      ex.id,
                                      set.id,
                                      'weightKg',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-14 sm:w-20 px-1.5 sm:px-2 py-1 bg-[#060c19] border border-[#1a2d56] rounded-lg text-white font-mono font-bold text-xs focus:border-amber-400 focus:outline-none"
                                />
                                <span className="text-[10px] sm:text-[11px] text-slate-400">kg</span>
                              </div>
                            </td>
                            <td className="py-2 px-1 sm:px-2">
                              <input
                                type="number"
                                value={set.reps || ''}
                                onChange={(e) =>
                                  handleUpdateSet(
                                    ex.id,
                                    set.id,
                                    'reps',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-12 sm:w-16 px-1.5 sm:px-2 py-1 bg-[#060c19] border border-[#1a2d56] rounded-lg text-white font-mono font-bold text-xs focus:border-amber-400 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSetCompleted(ex.id, set.id)}
                                className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                                  set.completed
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                                    : 'bg-[#060c19] border border-[#1a2d56] text-slate-400 hover:border-amber-400/60'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </td>
                            <td className="py-2 px-2 text-right">
                              <button
                                onClick={() =>
                                  handleRemoveSetFromActiveExercise(ex.id, set.id)
                                }
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add extra exercise on the fly */}
          <div className="bg-[#060c19] border border-dashed border-[#1a2d56] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Adicionar exercício na hora (ex: Elevação Lateral)..."
              value={liveNewExName}
              onChange={(e) => setLiveNewExName(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#0a142c] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
            />
            <select
              value={liveNewExGroup}
              onChange={(e) => setLiveNewExGroup(e.target.value as any)}
              className="px-3 py-2 bg-[#0a142c] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="peito">Peito</option>
              <option value="costas">Costas</option>
              <option value="pernas">Pernas</option>
              <option value="ombros">Ombros</option>
              <option value="bracos">Braços</option>
              <option value="abdomen">Abdômen</option>
            </select>
            <button
              onClick={handleAddExerciseToActiveSession}
              disabled={!liveNewExName.trim()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 disabled:opacity-50 transition-all shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas do treino
            </label>
            <input
              type="text"
              placeholder="Ex: Treino muito bom, consegui aumentar a carga..."
              value={activeSession.notes || ''}
              onChange={(e) => setActiveSession({ ...activeSession, notes: e.target.value })}
              className="w-full px-3 py-2 bg-[#060c19] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      ) : (
        /* MAIN WORKOUT HUB */
        <div className="space-y-6">
          {/* Subview Tabs: Minhas Fichas | Progressão de Carga | Histórico */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3">
            <div className="grid grid-cols-3 gap-1 w-full sm:flex sm:w-auto">
              <button
                onClick={() => setSubView('fichas')}
                className={`px-2 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center cursor-pointer ${
                  subView === 'fichas'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-[#122247]'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">
                  <span className="hidden sm:inline">Minhas Fichas</span>
                  <span className="sm:hidden">Fichas</span> ({workoutTemplates.length})
                </span>
              </button>

              <button
                onClick={() => setSubView('progression')}
                className={`px-2 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center cursor-pointer ${
                  subView === 'progression'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-[#122247]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">
                  <span className="hidden sm:inline">Progressão de Carga</span>
                  <span className="sm:hidden">Cargas</span>
                </span>
              </button>

              <button
                onClick={() => setSubView('history')}
                className={`px-2 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center cursor-pointer ${
                  subView === 'history'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-[#122247]'
                }`}
              >
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">
                  <span className="hidden sm:inline">Histórico</span>
                  <span className="sm:hidden">Histórico</span> ({workouts.length})
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleOpenCreateTemplate}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Nova Ficha de Treino
              </button>
              <button
                onClick={handleStartBlankWorkout}
                className="px-3 py-2 rounded-xl bg-[#122247] hover:bg-[#192f61] text-amber-200 border border-[#a16207]/40 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Iniciar treino avulso sem ficha"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" /> Treino Livre
              </button>
            </div>
          </div>

          {/* SUBVIEW 1: MINHAS FICHAS (starts clean, user creates them) */}
          {subView === 'fichas' && (
            <div className="space-y-4">
              {workoutTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workoutTemplates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="bg-[#0a142c] border border-[#1a2d56] hover:border-amber-400/40 rounded-3xl p-5 flex flex-col justify-between transition-all space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-400 font-mono uppercase">
                            {tmpl.muscleFocus || 'Ficha Personalizada'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditTemplate(tmpl)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#122247]"
                              title="Editar Ficha"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteWorkoutTemplate(tmpl.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#122247]"
                              title="Excluir Ficha"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-lg font-black text-white">{tmpl.name}</h4>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {tmpl.exercises.length} exercícios cadastrados
                        </div>

                        {/* List of exercises inside this ficha */}
                        <div className="mt-3 space-y-1.5 bg-[#060c19] p-3 rounded-2xl border border-[#17284f]">
                          {tmpl.exercises.slice(0, 5).map((ex, idx) => {
                            const latestRecorded = getLatestRecordedWeightForExercise(ex.name);
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs text-slate-200"
                              >
                                <span className="truncate max-w-[180px]">{ex.name}</span>
                                <span className="text-[11px] font-mono text-amber-400 font-bold">
                                  {latestRecorded > 0 ? `${latestRecorded} kg` : ex.targetReps || '3x10'}
                                </span>
                              </div>
                            );
                          })}
                          {tmpl.exercises.length > 5 && (
                            <div className="text-[10px] text-slate-400 pt-1">
                              + {tmpl.exercises.length - 5} outros exercícios...
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartFromTemplate(tmpl)}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
                      >
                        <Play className="w-4 h-4 fill-current" /> Treinar com Esta Ficha
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0a142c] border border-dashed border-[#1a2d56] rounded-3xl p-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                    <Dumbbell className="w-8 h-8" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="text-base font-bold text-white">
                      Nenhuma ficha de treino cadastrada ainda
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Crie suas fichas de treino personalizadas (ex: "Ficha A - Peito e Tríceps", "Ficha B - Costas e Bíceps", "Ficha C - Pernas"). Cada exercício criado fica gravado na sua memória de cargas!
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreateTemplate}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Criar Minha Primeira Ficha
                  </button>
                </div>
              )}
            </div>
          )}


          {/* SUBVIEW 2: PROGRESSÃO DE CARGA (Exercise Load Memory) */}
          {subView === 'progression' && (
            <div className="space-y-6">
              <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                      Memória & Progressão de Carga por Exercício
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Veja a evolução exata de peso levantado em cada sessão registrada
                    </p>
                  </div>

                  {allUniqueExercises.length > 0 && (
                    <select
                      value={activeProgressionExercise || ''}
                      onChange={(e) => setSelectedProgressionExercise(e.target.value)}
                      className="px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                    >
                      {allUniqueExercises.map((exName) => (
                        <option key={exName} value={exName}>
                          {exName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {activeProgressionExercise ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-[#060c19] p-3.5 rounded-2xl border border-[#17284f]">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Exercício
                        </span>
                        <div className="text-sm font-bold text-white mt-1 truncate">
                          {activeProgressionExercise}
                        </div>
                      </div>

                      <div className="bg-[#060c19] p-3.5 rounded-2xl border border-[#17284f]">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Última Carga Registrada
                        </span>
                        <div className="text-xl font-black text-amber-400 font-mono mt-1">
                          {getLatestRecordedWeightForExercise(activeProgressionExercise)} kg
                        </div>
                      </div>

                      <div className="bg-[#060c19] p-3.5 rounded-2xl border border-[#a16207]/40">
                        <span className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-400" /> Recorde Pessoal (PR)
                        </span>
                        <div className="text-xl font-black text-amber-300 font-mono mt-1">
                          {getPRForExercise(activeProgressionExercise)} kg
                        </div>
                      </div>

                      <div className="bg-[#060c19] p-3.5 rounded-2xl border border-[#17284f]">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Sessões Registradas
                        </span>
                        <div className="text-xl font-black text-white font-mono mt-1">
                          {exerciseProgressionHistory.length}
                        </div>
                      </div>
                    </div>

                    {/* Timeline of load progression */}
                    <div className="bg-[#060c19]/80 rounded-2xl p-4 border border-[#17284f]">
                      <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        Linha do Tempo de Cargas ({activeProgressionExercise})
                      </h5>

                      {exerciseProgressionHistory.length > 0 ? (
                        <div className="space-y-2.5">
                          {exerciseProgressionHistory.map((item, idx) => {
                            const isPR = item.maxWeight === getPRForExercise(activeProgressionExercise);
                            const prev = exerciseProgressionHistory[idx - 1];
                            const diff = prev ? item.maxWeight - prev.maxWeight : 0;

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-[#0a142c] border border-[#1a2d56] rounded-xl text-xs"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-slate-400">
                                    {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                  </span>
                                  <span className="text-slate-200 font-medium">
                                    {item.workoutName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="font-mono font-bold text-white text-sm">
                                    {item.maxWeight} kg
                                  </div>

                                  {diff !== 0 && (
                                    <span
                                      className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                        diff > 0
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      }`}
                                    >
                                      {diff > 0 ? `+${diff} kg` : `${diff} kg`}
                                    </span>
                                  )}

                                  {isPR && item.maxWeight > 0 && (
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                      <Trophy className="w-3 h-3 text-amber-400" /> PR
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-xs text-slate-500">
                          Nenhum treino registrado ainda para este exercício. Use sua ficha para gravar as primeiras cargas!
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500">
                    Crie uma ficha de treino e registre seus treinos para visualizar sua evolução de carga aqui.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBVIEW 3: HISTÓRICO DE TREINOS */}
          {subView === 'history' && (
            <div className="space-y-3">
              {workouts.length > 0 ? (
                workouts.map((w) => {
                  const totalKg = w.exercises.reduce(
                    (acc, ex) =>
                      acc +
                      ex.sets.reduce(
                        (sAcc, s) => sAcc + (s.completed ? s.weightKg * s.reps : 0),
                        0
                      ),
                    0
                  );

                    return (
                    <div
                      key={w.id}
                      className="bg-[#0a142c] border border-[#1a2d56] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{w.name}</span>
                          <span className="text-xs text-slate-400 font-mono">
                            • {new Date(w.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                          <span className="font-mono text-amber-400 font-bold">
                            {w.exercises.length} exercícios
                          </span>
                          <span>•</span>
                          <span className="font-mono">{w.durationMinutes} minutos</span>
                          {totalKg > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-amber-300">
                                {totalKg.toLocaleString('pt-BR')} kg totais levantados
                              </span>
                            </>
                          )}
                        </div>
                        {w.notes && (
                          <p className="text-xs text-slate-300 mt-2 bg-[#060c19] px-3 py-1.5 rounded-lg border border-[#17284f] inline-block">
                            "{w.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveSession({
                              ...w,
                              id: 'w-' + Date.now(),
                              date: new Date().toISOString().split('T')[0],
                              completed: false,
                            });
                            setIsLiveActive(true);
                          }}
                          className="px-3 py-1.5 bg-[#122247] hover:bg-[#182f61] text-amber-200 border border-[#a16207]/40 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Repetir Treino
                        </button>
                        <button
                          onClick={() => onDeleteWorkout(w.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-[#122247] rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 bg-[#0a142c] border border-dashed border-[#1a2d56] rounded-3xl text-xs text-slate-400">
                  Nenhum treino realizado ainda. Inicie seu primeiro treino para alimentar o histórico!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR FICHA DE TREINO */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060f]/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#0a142c] border border-[#1a2d56] rounded-3xl shadow-2xl overflow-hidden my-auto space-y-4">
            <div className="px-6 py-4 border-b border-[#17284f] flex items-center justify-between bg-[#081022]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingTemplateId ? 'Editar Ficha de Treino' : 'Criar Nova Ficha de Treino'}
                </h3>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#122247] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome da Ficha
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Treino A - Peito & Tríceps"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Foco Muscular
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Peitoral, Deltóide & Tríceps"
                    value={templateFocus}
                    onChange={(e) => setTemplateFocus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Add exercise inside draft ficha */}
              <div className="p-3.5 bg-[#060c19] rounded-2xl border border-[#17284f] space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Adicionar Exercício à Ficha
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome do exercício (ex: Supino Reto)"
                    value={tempExName}
                    onChange={(e) => setTempExName(e.target.value)}
                    className="px-3 py-2 bg-[#0a142c] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <select
                    value={tempExGroup}
                    onChange={(e) => setTempExGroup(e.target.value as any)}
                    className="px-3 py-2 bg-[#0a142c] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="peito">Peito</option>
                    <option value="costas">Costas</option>
                    <option value="pernas">Pernas</option>
                    <option value="ombros">Ombros</option>
                    <option value="bracos">Braços</option>
                    <option value="abdomen">Abdômen</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Séries Padrão</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={tempExSets}
                      onChange={(e) => setTempExSets(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-[#0a142c] border border-[#1a2d56] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Faixa de Repetições</label>
                    <input
                      type="text"
                      placeholder="Ex: 8-12 reps"
                      value={tempExReps}
                      onChange={(e) => setTempExReps(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#0a142c] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddExerciseToTemplate}
                  disabled={!tempExName.trim()}
                  className="w-full py-2 bg-[#122247] hover:bg-[#182f61] border border-[#a16207]/40 text-amber-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-400" /> Incluir Exercício na Ficha
                </button>
              </div>

              {/* Current exercises in draft */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Exercícios nesta Ficha ({templateExercises.length})
                </span>

                {templateExercises.length > 0 ? (
                  <div className="space-y-2">
                    {templateExercises.map((ex, idx) => (
                      <div
                        key={ex.id}
                        className="p-2.5 bg-[#060c19] border border-[#17284f] rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#122247] text-amber-400 font-mono text-[10px] font-bold flex items-center justify-center border border-amber-500/20">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-semibold text-white">{ex.name}</span>
                            <span className="text-slate-400 text-[11px] ml-1.5">
                              ({ex.defaultSets} séries • {ex.targetReps})
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveExerciseFromTemplate(ex.id)}
                          className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-[#17284f] rounded-xl bg-[#060c19]/50">
                    Nenhum exercício incluído ainda. Adicione acima!
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#17284f] bg-[#081022] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#a16207]/40 bg-[#122247] hover:bg-[#182f61] text-amber-200 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={!templateName.trim() || templateExercises.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all"
              >
                <Check className="w-4 h-4" /> Salvar Ficha de Treino
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
