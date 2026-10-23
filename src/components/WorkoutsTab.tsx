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
  GripVertical,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import {
  getStoredActiveWorkoutSession,
  saveStoredActiveWorkoutSession,
  clearStoredActiveWorkoutSession,
  saveStoredActiveTab,
} from '../utils/storage';

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

  // Drag and drop state for reordering exercises in template
  const [draggedExerciseIndex, setDraggedExerciseIndex] = useState<number | null>(null);
  const [dragOverExerciseIndex, setDragOverExerciseIndex] = useState<number | null>(null);
  const touchStartYRef = useRef<number>(0);
  const touchItemIndexRef = useRef<number | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Exercise input inside Ficha modal
  const [tempExName, setTempExName] = useState('');
  const [tempExGroup, setTempExGroup] = useState<WorkoutTemplateExercise['muscleGroup']>('peito');
  const [tempExSets, setTempExSets] = useState(3);
  const [tempExReps, setTempExReps] = useState('8-12 reps');

  // Exercise editing inside Ficha modal
  const [editingExId, setEditingExId] = useState<string | null>(null);
  const [editExName, setEditExName] = useState('');
  const [editExGroup, setEditExGroup] = useState<WorkoutTemplateExercise['muscleGroup']>('peito');
  const [editExSets, setEditExSets] = useState(3);
  const [editExReps, setEditExReps] = useState('8-12 reps');
  const [editExWeight, setEditExWeight] = useState<number | ''>('');

  // Direct Quick Edit / Add Exercise directly on Ficha Cards
  const [quickEditModal, setQuickEditModal] = useState<{
    templateId: string;
    templateName: string;
    exercise: WorkoutTemplateExercise;
    isNew?: boolean;
  } | null>(null);
  const [quickExName, setQuickExName] = useState('');
  const [quickExGroup, setQuickExGroup] = useState<WorkoutTemplateExercise['muscleGroup']>('peito');
  const [quickExSets, setQuickExSets] = useState(3);
  const [quickExReps, setQuickExReps] = useState('8-12 reps');
  const [quickExWeight, setQuickExWeight] = useState<number | ''>('');
  const [quickEditFeedback, setQuickEditFeedback] = useState<string | null>(null);

  // Expanded ficha exercises view
  const [expandedFichaIds, setExpandedFichaIds] = useState<Record<string, boolean>>({});

  const toggleExpandFicha = (id: string) => {
    setExpandedFichaIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Exercise editing inside active live session
  const [editingLiveExId, setEditingLiveExId] = useState<string | null>(null);
  const [editLiveExName, setEditLiveExName] = useState('');
  const [editLiveExReps, setEditLiveExReps] = useState('');

  // Active workout session with persistence across app switching / browser suspends
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(() => {
    const stored = getStoredActiveWorkoutSession();
    return stored?.session || null;
  });
  const [isLiveActive, setIsLiveActive] = useState<boolean>(() => {
    const stored = getStoredActiveWorkoutSession();
    return !!stored?.session;
  });
  const [sessionStartTime, setSessionStartTime] = useState<number>(() => {
    const stored = getStoredActiveWorkoutSession();
    return stored?.startTime || Date.now();
  });
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(() => {
    const stored = getStoredActiveWorkoutSession();
    if (stored?.startTime) {
      return Math.max(0, Math.floor((Date.now() - stored.startTime) / 1000));
    }
    return 0;
  });

  // Rest Timer with timestamp persistence
  const [restEndTime, setRestEndTime] = useState<number | null>(() => {
    const stored = getStoredActiveWorkoutSession();
    return stored?.restTimerEndTime || null;
  });
  const [restSeconds, setRestSeconds] = useState<number>(() => {
    const stored = getStoredActiveWorkoutSession();
    if (stored?.restTimerEndTime && stored.restTimerEndTime > Date.now()) {
      return Math.max(0, Math.ceil((stored.restTimerEndTime - Date.now()) / 1000));
    }
    return 0;
  });
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(() => {
    const stored = getStoredActiveWorkoutSession();
    return !!(stored?.restTimerEndTime && stored.restTimerEndTime > Date.now());
  });

  // Modal to confirm cancel workout
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Selected exercise for Progression View
  const [selectedProgressionExercise, setSelectedProgressionExercise] = useState<string | null>(null);

  // Time formatter (HH:MM:SS or MM:SS)
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Sync active session changes to localStorage immediately so no state is ever lost
  useEffect(() => {
    if (isLiveActive && activeSession) {
      saveStoredActiveWorkoutSession({
        session: activeSession,
        startTime: sessionStartTime,
        restTimerEndTime: isTimerRunning && restEndTime ? restEndTime : null,
        restTimerDuration: restSeconds,
        subView,
      });
      saveStoredActiveTab('workouts');
    }
  }, [activeSession, isLiveActive, sessionStartTime, restEndTime, isTimerRunning, subView, restSeconds]);

  // Real-time elapsed workout timer ticker (calculates from start timestamp)
  useEffect(() => {
    if (!isLiveActive) return;

    setLiveElapsedSeconds(Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000)));

    const interval = setInterval(() => {
      setLiveElapsedSeconds(Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveActive, sessionStartTime]);

  // Rest Timer countdown
  useEffect(() => {
    if (!isTimerRunning || !restEndTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000));
      setRestSeconds(remaining);

      if (remaining <= 0) {
        setIsTimerRunning(false);
        setRestEndTime(null);
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
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, restEndTime]);

  // Start rest timer
  const startRestTimer = (seconds: number) => {
    const end = Date.now() + seconds * 1000;
    setRestEndTime(end);
    setRestSeconds(seconds);
    setIsTimerRunning(true);
  };

  // Listen for visibility and focus changes (e.g. user returns from Spotify, WhatsApp, or locks phone)
  useEffect(() => {
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        const stored = getStoredActiveWorkoutSession();
        if (stored?.session) {
          setActiveSession(stored.session);
          setIsLiveActive(true);
          if (stored.startTime) {
            setSessionStartTime(stored.startTime);
            setLiveElapsedSeconds(Math.max(0, Math.floor((Date.now() - stored.startTime) / 1000)));
          }
          if (stored.restTimerEndTime && stored.restTimerEndTime > Date.now()) {
            const remaining = Math.max(0, Math.ceil((stored.restTimerEndTime - Date.now()) / 1000));
            setRestSeconds(remaining);
            setRestEndTime(stored.restTimerEndTime);
            setIsTimerRunning(true);
          } else if (stored.restTimerEndTime) {
            setRestSeconds(0);
            setRestEndTime(null);
            setIsTimerRunning(false);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  // Safeguard before unload/close
  useEffect(() => {
    if (!isLiveActive || !activeSession) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveStoredActiveWorkoutSession({
        session: activeSession,
        startTime: sessionStartTime,
        restTimerEndTime: isTimerRunning && restEndTime ? restEndTime : null,
        restTimerDuration: restSeconds,
        subView,
      });
      saveStoredActiveTab('workouts');
      e.preventDefault();
      e.returnValue = 'Seu treino está em andamento. Deseja sair?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLiveActive, activeSession, sessionStartTime, restEndTime, isTimerRunning, subView, restSeconds]);

  // Open modal to create a new ficha
  const handleOpenCreateTemplate = () => {
    setEditingTemplateId(null);
    setEditingExId(null);
    setTemplateName('');
    setTemplateFocus('');
    setTemplateExercises([]);
    setIsTemplateModalOpen(true);
  };

  // Open modal to edit existing ficha
  const handleOpenEditTemplate = (tmpl: WorkoutTemplate) => {
    setEditingTemplateId(tmpl.id);
    setEditingExId(null);
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

  // Start editing an exercise in the template draft
  const handleStartEditExercise = (ex: WorkoutTemplateExercise) => {
    setEditingExId(ex.id);
    setEditExName(ex.name);
    setEditExGroup(ex.muscleGroup);
    setEditExSets(ex.defaultSets || 3);
    setEditExReps(ex.targetReps || '8-12 reps');
    setEditExWeight(ex.lastWeightKg !== undefined && ex.lastWeightKg > 0 ? ex.lastWeightKg : '');
  };

  // Save edited exercise in template draft
  const handleSaveEditExercise = () => {
    if (!editingExId || !editExName.trim()) return;
    setTemplateExercises((prev) =>
      prev.map((ex) =>
        ex.id === editingExId
          ? {
              ...ex,
              name: editExName.trim(),
              muscleGroup: editExGroup,
              defaultSets: Math.max(1, Number(editExSets) || 3),
              targetReps: editExReps.trim() || '8-12 reps',
              lastWeightKg: editExWeight === '' ? 0 : Number(editExWeight),
            }
          : ex
      )
    );
    setEditingExId(null);
  };

  const handleCancelEditExercise = () => {
    setEditingExId(null);
  };

  // Open modal to quick edit an exercise from a Ficha card
  const handleOpenQuickEditExercise = (
    tmpl: WorkoutTemplate,
    ex: WorkoutTemplateExercise
  ) => {
    setQuickEditModal({
      templateId: tmpl.id,
      templateName: tmpl.name,
      exercise: ex,
      isNew: false,
    });
    setQuickExName(ex.name);
    setQuickExGroup(ex.muscleGroup);
    setQuickExSets(ex.defaultSets || 3);
    setQuickExReps(ex.targetReps || '8-12 reps');
    setQuickExWeight(ex.lastWeightKg !== undefined && ex.lastWeightKg > 0 ? ex.lastWeightKg : '');
  };

  // Open modal to quick add a new exercise directly to an existing Ficha
  const handleOpenAddExerciseToExistingTemplate = (tmpl: WorkoutTemplate) => {
    const focus = tmpl.muscleFocus?.toLowerCase() || '';
    let initialGroup: WorkoutTemplateExercise['muscleGroup'] = 'peito';
    if (focus.includes('costa') || focus.includes('dorsal')) initialGroup = 'costas';
    else if (focus.includes('perna') || focus.includes('quadríceps') || focus.includes('posterior')) initialGroup = 'pernas';
    else if (focus.includes('ombro') || focus.includes('deltoide')) initialGroup = 'ombros';
    else if (focus.includes('braço') || focus.includes('bíceps') || focus.includes('tríceps')) initialGroup = 'bracos';
    else if (focus.includes('abd') || focus.includes('core')) initialGroup = 'abdomen';

    const newEx: WorkoutTemplateExercise = {
      id: 'te-' + Date.now(),
      name: '',
      muscleGroup: initialGroup,
      defaultSets: 3,
      targetReps: '8-12 reps',
      lastWeightKg: 0,
    };

    setQuickEditModal({
      templateId: tmpl.id,
      templateName: tmpl.name,
      exercise: newEx,
      isNew: true,
    });
    setQuickExName('');
    setQuickExGroup(initialGroup);
    setQuickExSets(3);
    setQuickExReps('8-12 reps');
    setQuickExWeight('');
  };

  // Save quick edited/added exercise directly to Ficha
  const handleSaveQuickEditExercise = () => {
    if (!quickEditModal || !quickExName.trim()) return;
    const targetTemplate = workoutTemplates.find((t) => t.id === quickEditModal.templateId);
    if (!targetTemplate) return;

    let updatedExercises: WorkoutTemplateExercise[];
    if (quickEditModal.isNew) {
      const newExItem: WorkoutTemplateExercise = {
        id: quickEditModal.exercise.id || 'te-' + Date.now(),
        name: quickExName.trim(),
        muscleGroup: quickExGroup,
        defaultSets: Math.max(1, Number(quickExSets) || 3),
        targetReps: quickExReps.trim() || '8-12 reps',
        lastWeightKg: quickExWeight === '' ? 0 : Number(quickExWeight),
      };
      updatedExercises = [...targetTemplate.exercises, newExItem];
    } else {
      updatedExercises = targetTemplate.exercises.map((ex) => {
        if (ex.id === quickEditModal.exercise.id) {
          return {
            ...ex,
            name: quickExName.trim(),
            muscleGroup: quickExGroup,
            defaultSets: Math.max(1, Number(quickExSets) || 3),
            targetReps: quickExReps.trim() || '8-12 reps',
            lastWeightKg: quickExWeight === '' ? 0 : Number(quickExWeight),
          };
        }
        return ex;
      });
    }

    const updatedTemplate: WorkoutTemplate = {
      ...targetTemplate,
      exercises: updatedExercises,
    };

    onSaveWorkoutTemplate(updatedTemplate);
    const actionText = quickEditModal.isNew ? 'adicionado à' : 'atualizado na';
    setQuickEditFeedback(`Exercício "${quickExName.trim()}" ${actionText} ficha "${targetTemplate.name}"!`);
    setTimeout(() => setQuickEditFeedback(null), 3500);
    setQuickEditModal(null);
  };

  // Delete exercise directly from Ficha via Quick Edit Modal
  const handleDeleteQuickEditExercise = () => {
    if (!quickEditModal) return;
    const targetTemplate = workoutTemplates.find((t) => t.id === quickEditModal.templateId);
    if (!targetTemplate) return;

    const updatedExercises = targetTemplate.exercises.filter(
      (ex) => ex.id !== quickEditModal.exercise.id
    );

    const updatedTemplate: WorkoutTemplate = {
      ...targetTemplate,
      exercises: updatedExercises,
    };

    onSaveWorkoutTemplate(updatedTemplate);
    setQuickEditFeedback(`Exercício removido da ficha "${targetTemplate.name}"!`);
    setTimeout(() => setQuickEditFeedback(null), 3500);
    setQuickEditModal(null);
  };

  // Live workout exercise editing
  const handleStartEditLiveExercise = (ex: WorkoutExercise) => {
    setEditingLiveExId(ex.id);
    setEditLiveExName(ex.name);
    setEditLiveExReps(ex.targetReps || '');
  };

  const handleSaveEditLiveExercise = () => {
    if (!editingLiveExId || !editLiveExName.trim() || !activeSession) return;
    setActiveSession({
      ...activeSession,
      exercises: activeSession.exercises.map((ex) =>
        ex.id === editingLiveExId
          ? {
              ...ex,
              name: editLiveExName.trim(),
              targetReps: editLiveExReps.trim() || undefined,
            }
          : ex
      ),
    });
    setEditingLiveExId(null);
  };

  const handleRemoveExerciseFromTemplate = (id: string) => {
    if (editingExId === id) setEditingExId(null);
    setTemplateExercises(templateExercises.filter((e) => e.id !== id));
  };

  // Reorder exercises in template
  const handleMoveExercise = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= templateExercises.length || fromIndex === toIndex) return;
    setTemplateExercises((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedExerciseIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverExerciseIndex !== index) {
      setDragOverExerciseIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedExerciseIndex !== null && draggedExerciseIndex !== targetIndex) {
      handleMoveExercise(draggedExerciseIndex, targetIndex);
    }
    setDraggedExerciseIndex(null);
    setDragOverExerciseIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedExerciseIndex(null);
    setDragOverExerciseIndex(null);
  };

  // Touch handlers for mobile press-and-drag
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchItemIndexRef.current = index;
    setDraggedExerciseIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchItemIndexRef.current === null) return;
    const currentY = e.touches[0].clientY;

    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (currentY >= rect.top && currentY <= rect.bottom) {
          if (i !== touchItemIndexRef.current) {
            handleMoveExercise(touchItemIndexRef.current, i);
            touchItemIndexRef.current = i;
            setDraggedExerciseIndex(i);
          }
          break;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    touchItemIndexRef.current = null;
    setDraggedExerciseIndex(null);
    setDragOverExerciseIndex(null);
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
    const startTimeMs = Date.now();
    // Find the latest loads used for each exercise from previous workout sessions
    const session: WorkoutSession = {
      id: 'w-' + startTimeMs,
      date: new Date().toISOString().split('T')[0],
      templateId: template.id,
      name: template.name,
      durationMinutes: 45,
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
            id: `s-${tmplEx.id}-${i}-${startTimeMs}`,
            setNumber: i,
            weightKg: weightToUse,
            reps: 10,
            completed: false,
          });
        }

        return {
          id: 'ex-' + tmplEx.id + '-' + startTimeMs,
          name: tmplEx.name,
          muscleGroup: tmplEx.muscleGroup,
          targetReps: tmplEx.targetReps,
          pr: getPRForExercise(tmplEx.name),
          sets,
        };
      }),
    };

    setSessionStartTime(startTimeMs);
    setLiveElapsedSeconds(0);
    setActiveSession(session);
    setIsLiveActive(true);
    setRestEndTime(null);
    setIsTimerRunning(false);

    saveStoredActiveWorkoutSession({
      session,
      startTime: startTimeMs,
      restTimerEndTime: null,
      subView: 'fichas',
    });
    saveStoredActiveTab('workouts');
  };

  // Start free blank workout
  const handleStartBlankWorkout = () => {
    const startTimeMs = Date.now();
    const session: WorkoutSession = {
      id: 'w-' + startTimeMs,
      date: new Date().toISOString().split('T')[0],
      name: 'Treino de Hoje',
      durationMinutes: 45,
      estimatedCaloriesBurned: 300,
      completed: false,
      notes: '',
      exercises: [],
    };

    setSessionStartTime(startTimeMs);
    setLiveElapsedSeconds(0);
    setActiveSession(session);
    setIsLiveActive(true);
    setRestEndTime(null);
    setIsTimerRunning(false);

    saveStoredActiveWorkoutSession({
      session,
      startTime: startTimeMs,
      restTimerEndTime: null,
      subView: 'fichas',
    });
    saveStoredActiveTab('workouts');
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

    const actualDurationMinutes = Math.max(1, Math.round(liveElapsedSeconds / 60));

    const finished: WorkoutSession = {
      ...activeSession,
      durationMinutes: actualDurationMinutes,
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

    clearStoredActiveWorkoutSession();
    setIsLiveActive(false);
    setActiveSession(null);
    setRestEndTime(null);
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
              {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
            </span>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setRestEndTime(null);
                setRestSeconds(0);
              }}
              className="px-3 py-1 bg-black/30 hover:bg-black/50 text-white rounded-lg text-xs font-bold cursor-pointer"
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Sessão em Andamento
                </span>
                <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {formatTime(liveElapsedSeconds)}
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Salvo automaticamente
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
                onClick={() => setIsCancelModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#122247] hover:bg-[#182f61] text-slate-300 hover:text-white text-xs font-semibold border border-[#1a2d56] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinishWorkout}
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
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
                        {editingLiveExId === ex.id ? (
                          <div className="flex flex-wrap items-center gap-2 py-1">
                            <input
                              type="text"
                              value={editLiveExName}
                              onChange={(e) => setEditLiveExName(e.target.value)}
                              className="px-2.5 py-1 bg-[#060c19] border border-amber-400 rounded-lg text-white font-bold text-xs focus:outline-none"
                              placeholder="Nome do exercício"
                            />
                            <input
                              type="text"
                              value={editLiveExReps}
                              onChange={(e) => setEditLiveExReps(e.target.value)}
                              className="px-2 py-1 bg-[#060c19] border border-[#1a2d56] rounded-lg text-white text-xs w-28 focus:outline-none focus:border-amber-400"
                              placeholder="Meta (ex: 8-12)"
                            />
                            <button
                              type="button"
                              onClick={handleSaveEditLiveExercise}
                              className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLiveExId(null)}
                              className="px-2 py-1 rounded-lg bg-[#122247] hover:bg-[#1a3264] text-slate-300 text-xs cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              {ex.name}
                              {ex.pr && ex.pr > 0 ? (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono flex items-center gap-1">
                                  <Trophy className="w-3 h-3" /> PR: {ex.pr}kg
                                </span>
                              ) : null}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleStartEditLiveExercise(ex)}
                              className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-[#122247] transition-colors cursor-pointer"
                              title="Editar nome ou meta deste exercício"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
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
              {/* Feedback toast for quick exercise updates */}
              {quickEditFeedback && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 shadow-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{quickEditFeedback}</span>
                  </div>
                  <button
                    onClick={() => setQuickEditFeedback(null)}
                    className="p-1 rounded-lg text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {workoutTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workoutTemplates.map((tmpl) => {
                    const isExpanded = !!expandedFichaIds[tmpl.id];
                    const displayExercises = isExpanded
                      ? tmpl.exercises
                      : tmpl.exercises.slice(0, 4);

                    return (
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
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#122247] cursor-pointer"
                                title="Editar Estrutura da Ficha"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteWorkoutTemplate(tmpl.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#122247] cursor-pointer"
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

                          {/* List of exercises inside this ficha with direct edit option */}
                          <div className="mt-3 space-y-1.5 bg-[#060c19] p-2.5 rounded-2xl border border-[#17284f]">
                            <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-bold text-slate-400 border-b border-[#14264f]">
                              <span>Exercícios ({tmpl.exercises.length})</span>
                              <button
                                type="button"
                                onClick={() => handleOpenAddExerciseToExistingTemplate(tmpl)}
                                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer text-[10px]"
                                title="Adicionar exercício a esta ficha"
                              >
                                <Plus className="w-3 h-3" /> Adicionar
                              </button>
                            </div>

                            {displayExercises.map((ex, idx) => {
                              const latestRecorded = getLatestRecordedWeightForExercise(ex.name);
                              return (
                                <div
                                  key={ex.id || idx}
                                  className="group flex items-center justify-between text-xs py-1 px-1.5 rounded-xl hover:bg-[#122247]/60 transition-colors border border-transparent hover:border-[#1a3264]/40"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="w-4 h-4 rounded-md bg-[#122247] text-amber-400 font-mono text-[9px] font-bold flex items-center justify-center shrink-0 border border-amber-500/20">
                                      {idx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="truncate font-semibold text-slate-100 group-hover:text-amber-200 transition-colors">
                                          {ex.name}
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-amber-400/80 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20 shrink-0">
                                          {ex.muscleGroup}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 block">
                                        {ex.defaultSets} séries • {ex.targetReps || '8-12 reps'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    {latestRecorded > 0 ? (
                                      <span
                                        className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20"
                                        title="Última carga registrada"
                                      >
                                        {latestRecorded} kg
                                      </span>
                                    ) : ex.lastWeightKg && ex.lastWeightKg > 0 ? (
                                      <span className="text-[11px] font-mono text-amber-400 font-bold" title="Carga base">
                                        {ex.lastWeightKg} kg
                                      </span>
                                    ) : null}

                                    {/* Direct Edit Exercise Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenQuickEditExercise(tmpl, ex)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-[#182f61] transition-all cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                                      title="Editar este exercício (nome, repetições, séries, grupo)"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline text-[10px]">Editar</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {tmpl.exercises.length > 4 && (
                              <button
                                type="button"
                                onClick={() => toggleExpandFicha(tmpl.id)}
                                className="w-full pt-1.5 pb-0.5 text-center text-[11px] text-amber-400/90 hover:text-amber-300 font-bold flex items-center justify-center gap-1 border-t border-[#14264f] mt-1 cursor-pointer transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3.5 h-3.5" /> Recolher lista
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3.5 h-3.5" /> Ver todos os {tmpl.exercises.length} exercícios (+{tmpl.exercises.length - 4})
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartFromTemplate(tmpl)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-current" /> Treinar com Esta Ficha
                        </button>
                      </div>
                    );
                  })}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060f]/85 backdrop-blur-md overflow-y-auto safe-area-top safe-area-bottom">
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

              {/* Current exercises in draft with drag-and-drop reordering */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Exercícios nesta Ficha ({templateExercises.length})
                  </span>
                  {templateExercises.length > 1 && (
                    <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                      <GripVertical className="w-3.5 h-3.5" /> Segure e arraste para ordenar
                    </span>
                  )}
                </div>

                {templateExercises.length > 0 ? (
                  <div className="space-y-2">
                    {templateExercises.map((ex, idx) => {
                      const isDragging = draggedExerciseIndex === idx;
                      const isDragOver = dragOverExerciseIndex === idx && !isDragging;

                      if (editingExId === ex.id) {
                        return (
                          <div
                            key={ex.id}
                            className="p-3 sm:p-4 rounded-2xl bg-[#081329] border-2 border-amber-400 shadow-xl space-y-3 animate-in fade-in duration-150"
                          >
                            <div className="flex items-center justify-between border-b border-[#14264f] pb-2">
                              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                <Edit2 className="w-3.5 h-3.5 text-amber-400" /> Editando Exercício #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={handleCancelEditExercise}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#122247] transition-colors cursor-pointer"
                                title="Cancelar edição"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                                  Nome do Exercício *
                                </label>
                                <input
                                  type="text"
                                  value={editExName}
                                  onChange={(e) => setEditExName(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-[#050a18] border border-[#1a2d56] rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                                  placeholder="Nome do exercício"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                                  Grupo Muscular
                                </label>
                                <select
                                  value={editExGroup}
                                  onChange={(e) => setEditExGroup(e.target.value as any)}
                                  className="w-full px-3 py-1.5 bg-[#050a18] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                                >
                                  <option value="peito">Peito</option>
                                  <option value="costas">Costas</option>
                                  <option value="pernas">Pernas</option>
                                  <option value="ombros">Ombros</option>
                                  <option value="bracos">Braços</option>
                                  <option value="abdomen">Abdômen</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                                  Séries Padrão
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="15"
                                  value={editExSets}
                                  onChange={(e) => setEditExSets(Number(e.target.value))}
                                  className="w-full px-3 py-1.5 bg-[#050a18] border border-[#1a2d56] rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                                  Faixa de Repetições
                                </label>
                                <input
                                  type="text"
                                  value={editExReps}
                                  onChange={(e) => setEditExReps(e.target.value)}
                                  placeholder="Ex: 8-12 reps, 4x10, etc."
                                  className="w-full px-3 py-1.5 bg-[#050a18] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                                  Carga Base (kg)
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={editExWeight}
                                  onChange={(e) =>
                                    setEditExWeight(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))
                                  }
                                  placeholder="Opcional (ex: 20)"
                                  className="w-full px-3 py-1.5 bg-[#050a18] border border-[#1a2d56] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                                />
                              </div>
                            </div>

                            {/* Quick Presets for Repetitions */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] text-slate-400 font-medium mr-1">Sugestões:</span>
                              {['8-12 reps', '10-12 reps', '4x10', '12-15 reps', '6-8 reps', 'Até a falha'].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setEditExReps(preset)}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer border ${
                                    editExReps === preset
                                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                                      : 'bg-[#0f1d3a] hover:bg-[#15274d] text-slate-300 border-[#1a2d56]'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#14264f]">
                              <button
                                type="button"
                                onClick={handleCancelEditExercise}
                                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveEditExercise}
                                disabled={!editExName.trim()}
                                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Salvar Exercício
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={ex.id}
                          ref={(el) => {
                            itemRefs.current[idx] = el;
                          }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDrop={(e) => handleDrop(e, idx)}
                          onDragEnd={handleDragEnd}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all select-none ${
                            isDragging
                              ? 'bg-[#122247] border-amber-400 opacity-60 shadow-lg scale-[1.01]'
                              : isDragOver
                              ? 'bg-[#0f1d3a] border-amber-400/80 shadow-md'
                              : 'bg-[#060c19] border-[#17284f] hover:border-[#1e3a6e]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Drag Grip Handle with touch and mouse drag capabilities */}
                            <div
                              onTouchStart={(e) => handleTouchStart(e, idx)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                              className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-amber-400 transition-colors shrink-0"
                              title="Segure e arraste para reordenar"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>

                            <span className="w-5 h-5 rounded-md bg-[#122247] text-amber-400 font-mono text-[10px] font-bold flex items-center justify-center border border-amber-500/20 shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-white truncate block">{ex.name}</span>
                                <span className="text-[10px] uppercase font-bold text-amber-400/80 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                  {ex.muscleGroup}
                                </span>
                              </div>
                              <span className="text-slate-400 text-[11px] block mt-0.5">
                                {ex.defaultSets} séries • {ex.targetReps}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Quick Accessible Move Up/Down buttons */}
                            <div className="flex items-center gap-0.5 mr-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveExercise(idx, idx - 1)}
                                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#122247] disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                                title="Mover para cima"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === templateExercises.length - 1}
                                onClick={() => handleMoveExercise(idx, idx + 1)}
                                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#122247] disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                                title="Mover para baixo"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Edit Exercise Button */}
                            <button
                              type="button"
                              onClick={() => handleStartEditExercise(ex)}
                              className="text-slate-400 hover:text-amber-400 p-1.5 rounded-md hover:bg-[#122247] transition-colors cursor-pointer"
                              title="Editar este exercício (nome, repetições, séries)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Exercise Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveExerciseFromTemplate(ex.id)}
                              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-950/20 transition-colors cursor-pointer"
                              title="Remover exercício da ficha"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
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

      {/* Quick Edit / Add Exercise Modal directly on Ficha Cards */}
      {quickEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060f]/85 backdrop-blur-md overflow-y-auto safe-area-top safe-area-bottom animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0a142c] border border-amber-400/40 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden my-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#17284f] flex items-center justify-between bg-gradient-to-r from-[#0c1836] to-[#081022]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    {quickEditModal.isNew ? 'Adicionar Exercício' : 'Editar Exercício'}
                  </h3>
                  <p className="text-xs text-amber-400/90 font-mono">
                    Ficha: {quickEditModal.templateName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#122247] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Nome do Exercício */}
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Nome do Exercício <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={quickExName}
                  onChange={(e) => setQuickExName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#060c19] border border-[#1a2d56] focus:border-amber-400 rounded-xl text-white text-sm font-semibold focus:outline-none transition-colors"
                  placeholder="Ex: Supino Reto com Barra, Puxada Alta, Leg Press..."
                  autoFocus
                />
              </div>

              {/* Grupo Muscular */}
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Grupo Muscular
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(
                    [
                      { id: 'peito', label: 'Peito' },
                      { id: 'costas', label: 'Costas' },
                      { id: 'pernas', label: 'Pernas' },
                      { id: 'ombros', label: 'Ombros' },
                      { id: 'bracos', label: 'Braços' },
                      { id: 'abdomen', label: 'Abdômen' },
                    ] as const
                  ).map((grp) => {
                    const isSelected = quickExGroup === grp.id;
                    return (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => setQuickExGroup(grp.id)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-[#060c19] text-slate-300 border-[#1a2d56] hover:border-slate-600'
                        }`}
                      >
                        {grp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Séries e Carga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                    Séries Padrão
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickExSets((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-[#060c19] border border-[#1a2d56] hover:border-amber-400/50 text-white font-bold text-lg flex items-center justify-center transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={quickExSets}
                      onChange={(e) => setQuickExSets(Math.max(1, Number(e.target.value) || 1))}
                      className="flex-1 h-10 px-3 bg-[#060c19] border border-[#1a2d56] focus:border-amber-400 rounded-xl text-white text-center font-mono font-bold text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuickExSets((prev) => Math.min(20, prev + 1))}
                      className="w-10 h-10 rounded-xl bg-[#060c19] border border-[#1a2d56] hover:border-amber-400/50 text-white font-bold text-lg flex items-center justify-center transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                    Carga Base / Referência (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={quickExWeight}
                    onChange={(e) =>
                      setQuickExWeight(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    placeholder="Opcional (ex: 20)"
                    className="w-full h-10 px-4 bg-[#060c19] border border-[#1a2d56] focus:border-amber-400 rounded-xl text-white font-mono text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Faixa de Repetições */}
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Faixa de Repetições / Meta <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={quickExReps}
                  onChange={(e) => setQuickExReps(e.target.value)}
                  placeholder="Ex: 8-12 reps, 4x10, 12-15 reps..."
                  className="w-full px-4 py-2.5 bg-[#060c19] border border-[#1a2d56] focus:border-amber-400 rounded-xl text-white text-sm focus:outline-none transition-colors"
                />

                {/* Quick Presets for Repetitions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['8-12 reps', '10-12 reps', '4x10', '12-15 reps', '6-8 reps', 'Até a falha'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuickExReps(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                        quickExReps === preset
                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-sm'
                          : 'bg-[#0f1d3a] hover:bg-[#15274d] text-slate-300 border-[#1a2d56]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#17284f] bg-[#081022] flex items-center justify-between gap-3">
              {!quickEditModal.isNew ? (
                <button
                  type="button"
                  onClick={handleDeleteQuickEditExercise}
                  className="px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Excluir este exercício da ficha"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Excluir da Ficha</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickEditModal(null)}
                  className="px-4 py-2 rounded-xl border border-[#a16207]/40 bg-[#122247] hover:bg-[#182f61] text-amber-200 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickEditExercise}
                  disabled={!quickExName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Salvar Exercício
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Confirm Canceling Active Workout */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03060f]/85 backdrop-blur-md safe-area-top safe-area-bottom animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-[#0a142c] border border-rose-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">
                Cancelar este treino?
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                O progresso e as séries realizadas nesta sessão serão descartados. Tem certeza que deseja cancelar?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-[#1a2d56] bg-[#122247] hover:bg-[#182f61] text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Continuar Treinando
              </button>
              <button
                type="button"
                onClick={() => {
                  clearStoredActiveWorkoutSession();
                  setIsLiveActive(false);
                  setActiveSession(null);
                  setRestEndTime(null);
                  setIsTimerRunning(false);
                  setIsCancelModalOpen(false);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 cursor-pointer transition-colors"
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
