import React, { useState } from 'react';
import { HabitItem, HabitCategory } from '../types/fitness';
import {
  CheckCircle2,
  Circle,
  Flame,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Trophy,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Dumbbell,
  Droplet,
  Pill,
  Moon,
  BookOpen,
  Heart,
  Zap,
  Apple,
  Check,
  X,
  Target,
  Award,
} from 'lucide-react';

interface HabitsTabProps {
  habits: HabitItem[];
  onAddHabit: (habit: Omit<HabitItem, 'id' | 'createdAt' | 'completedDates'>) => void;
  onUpdateHabit: (habit: HabitItem) => void;
  onDeleteHabit: (id: string) => void;
  onToggleHabitDate: (habitId: string, dateStr: string) => void;
}

const CATEGORY_LABELS: Record<HabitCategory, { label: string; icon: string; badgeClass: string }> = {
  treino: {
    label: 'Treino & Físico',
    icon: '🏋️',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  nutricao: {
    label: 'Nutrição & Dieta',
    icon: '🥗',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  },
  saude: {
    label: 'Saúde & Sono',
    icon: '💧',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  mente: {
    label: 'Mente & Foco',
    icon: '🧠',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  geral: {
    label: 'Geral',
    icon: '⚡',
    badgeClass: 'bg-slate-700/30 text-slate-300 border-slate-600/30',
  },
};

const AVAILABLE_ICONS = [
  { name: 'Dumbbell', icon: Dumbbell, label: 'Treino' },
  { name: 'Droplet', icon: Droplet, label: 'Água' },
  { name: 'Pill', icon: Pill, label: 'Suplemento' },
  { name: 'Moon', icon: Moon, label: 'Sono' },
  { name: 'Apple', icon: Apple, label: 'Dieta' },
  { name: 'Heart', icon: Heart, label: 'Cardio' },
  { name: 'Zap', icon: Zap, label: 'Energia' },
  { name: 'BookOpen', icon: BookOpen, label: 'Estudo/Mente' },
];

export const HabitsTab: React.FC<HabitsTabProps> = ({
  habits,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onToggleHabitDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'todos'>('todos');

  // Modal State for New/Edit Habit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<HabitCategory>('treino');
  const [formDescription, setFormDescription] = useState('');
  const [formTargetDays, setFormTargetDays] = useState<number>(7);
  const [formIcon, setFormIcon] = useState('Dumbbell');

  // Date navigation
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Filtered habits
  const filteredHabits = habits.filter((h) =>
    selectedCategory === 'todos' ? true : h.category === selectedCategory
  );

  // Daily statistics for the selected date
  const completedTodayCount = habits.filter((h) =>
    h.completedDates.includes(selectedDate)
  ).length;
  const totalHabitsCount = habits.length;
  const completionPercentage =
    totalHabitsCount > 0 ? Math.round((completedTodayCount / totalHabitsCount) * 100) : 0;

  // Streak calculations
  const calculateHabitStreak = (h: HabitItem): number => {
    if (!h.completedDates || h.completedDates.length === 0) return 0;
    const sorted = [...h.completedDates].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    // Check if habit is completed today or yesterday to continue streak
    if (!sorted.includes(today) && !sorted.includes(yesterday)) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date(sorted.includes(today) ? today : yesterday);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sorted.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  // Best streak across all habits
  const bestStreak = habits.reduce((max, h) => Math.max(max, calculateHabitStreak(h)), 0);

  // Last 7 days for the mini weekly strip
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLetter = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d.getDay()];
    const dayNumber = d.getDate();
    return { dateStr, dayLetter, dayNumber };
  });

  // Last 14 days for the consistency heatmap
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayNum = d.getDate();
    const count = habits.filter((h) => h.completedDates.includes(dateStr)).length;
    const pct = totalHabitsCount > 0 ? count / totalHabitsCount : 0;
    return { dateStr, dayNum, count, pct };
  });

  // Modal open helpers
  const handleOpenCreateModal = () => {
    setEditingHabitId(null);
    setFormName('');
    setFormCategory('treino');
    setFormDescription('');
    setFormTargetDays(7);
    setFormIcon('Dumbbell');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (h: HabitItem) => {
    setEditingHabitId(h.id);
    setFormName(h.name);
    setFormCategory(h.category);
    setFormDescription(h.description || '');
    setFormTargetDays(h.targetPerWeek || 7);
    setFormIcon(h.iconName || 'Dumbbell');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingHabitId) {
      const existing = habits.find((h) => h.id === editingHabitId);
      if (existing) {
        onUpdateHabit({
          ...existing,
          name: formName.trim(),
          category: formCategory,
          description: formDescription.trim(),
          targetPerWeek: formTargetDays,
          iconName: formIcon,
        });
      }
    } else {
      onAddHabit({
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        targetPerWeek: formTargetDays,
        iconName: formIcon,
      });
    }

    setIsModalOpen(false);
  };

  // Helper to dynamically render habit icon
  const renderHabitIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Droplet':
        return <Droplet className={className} />;
      case 'Pill':
        return <Pill className={className} />;
      case 'Moon':
        return <Moon className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Apple':
        return <Apple className={className} />;
      case 'Heart':
        return <Heart className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Dumbbell':
      default:
        return <Dumbbell className={className} />;
    }
  };

  // Quick Action: Complete All for Selected Date
  const handleCompleteAllToday = () => {
    habits.forEach((h) => {
      if (!h.completedDates.includes(selectedDate)) {
        onToggleHabitDate(h.id, selectedDate);
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Aliyah Luxury Palette */}
      <div className="bg-gradient-to-r from-[#0a142c] via-[#0d1a38] to-[#12244f] border border-[#1a2d56] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" /> Habit Tracker & Constância
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-300 font-mono">Aliyah Ritual</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Rituais & Hábitos Diários
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Pequenas vitórias diárias constroem transformações definitivas. Marque seus hábitos, acumule sequências douradas e acompanhe sua evolução contínua.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto relative z-10">
          <button
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
          >
            <Plus className="w-4 h-4" /> Criar Novo Hábito
          </button>
        </div>
      </div>

      {/* Date Navigation & Status Strip */}
      <div className="bg-[#0a142c] border border-[#1a2d56] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-xl bg-[#060c19] border border-[#17284f] text-slate-300 hover:text-white hover:bg-[#122247] transition-all"
            title="Dia anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-center sm:text-left">
            <Calendar className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs sm:text-sm font-bold text-white capitalize block">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {isToday ? 'Hoje • Registro em tempo real' : 'Histórico de registro'}
              </span>
            </div>
          </div>

          <button
            onClick={() => shiftDate(1)}
            className="p-2 rounded-xl bg-[#060c19] border border-[#17284f] text-slate-300 hover:text-white hover:bg-[#122247] transition-all"
            title="Próximo dia"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Date Switcher */}
        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 rounded-xl bg-[#122247] border border-[#a16207]/40 text-amber-200 text-xs font-semibold hover:bg-[#182f61] transition-all"
            >
              Voltar para Hoje
            </button>
          )}

          {habits.length > 0 && completedTodayCount < totalHabitsCount && (
            <button
              onClick={handleCompleteAllToday}
              className="px-3 py-1.5 rounded-xl bg-[#122247] border border-[#1a2d56] text-slate-200 text-xs font-semibold hover:bg-[#182f61] transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>Concluir Todos</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Metric Cards: Golden Completion Ring & Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Completion Percentage Ring */}
        <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-xl flex items-center gap-5">
          {/* Radial Dial */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#060c19]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-amber-400 transition-all duration-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                strokeDasharray={`${completionPercentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-white font-mono">
                {completionPercentage}%
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Conclusão Diária
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">
              {completedTodayCount} de {totalHabitsCount} feitos
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {completionPercentage === 100
                ? '🏆 Dia 100% perfeito! Ritual concluído com maestria.'
                : completionPercentage >= 50
                ? 'Ótimo ritmo! Mantenha a constância para fechar o dia.'
                : 'Inicie marcando seu primeiro hábito de hoje.'}
            </p>
          </div>
        </div>

        {/* Card 2: Highest Streak */}
        <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="w-7 h-7 fill-amber-400/40" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Maior Sequência
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white font-mono">{bestStreak}</span>
              <span className="text-xs text-slate-400 font-semibold">dias seguidos</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Consistência é o pilar que diferencia intenção de resultado real.
            </p>
          </div>
        </div>

        {/* Card 3: Consistency Rate & Active Count */}
        <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#122247] border border-[#a16207]/40 text-amber-300 flex items-center justify-center shrink-0">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Hábitos no Plano
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white font-mono">{habits.length}</span>
              <span className="text-xs text-slate-400 font-semibold">rituais ativos</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Personalize com treino, hidratação, sono e metas nutricionais.
            </p>
          </div>
        </div>
      </div>

      {/* 14-Day Consistency Heatmap Grid */}
      <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Matriz de Constância (Últimos 14 Dias)
          </span>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <span>0%</span>
            <div className="w-3 h-3 rounded bg-[#060c19] border border-[#1a2d56]" />
            <div className="w-3 h-3 rounded bg-amber-500/30" />
            <div className="w-3 h-3 rounded bg-amber-500/70" />
            <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-400 to-yellow-400" />
            <span>100%</span>
          </div>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
          {last14Days.map((day) => {
            const isDaySelected = day.dateStr === selectedDate;
            let bgColor = 'bg-[#060c19] border-[#17284f] text-slate-400';
            if (day.pct >= 1) {
              bgColor = 'bg-gradient-to-tr from-amber-500 to-yellow-400 border-amber-300 text-slate-950 font-black shadow-md shadow-amber-500/30';
            } else if (day.pct >= 0.6) {
              bgColor = 'bg-amber-500/60 border-amber-400/50 text-white font-bold';
            } else if (day.pct > 0) {
              bgColor = 'bg-amber-500/25 border-amber-500/30 text-amber-200';
            }

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => setSelectedDate(day.dateStr)}
                className={`p-2 rounded-xl border text-center transition-all ${bgColor} ${
                  isDaySelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#060c19]' : ''
                }`}
                title={`${new Date(day.dateStr + 'T12:00:00').toLocaleDateString('pt-BR')}: ${day.count} hábitos feitos`}
              >
                <div className="text-[10px] uppercase font-mono opacity-80">
                  {new Date(day.dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'narrow' })}
                </div>
                <div className="text-xs font-bold font-mono mt-0.5">{day.dayNum}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter Pills - Wrapped with 0 horizontal scroll */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {(['todos', 'treino', 'nutricao', 'saude', 'mente', 'geral'] as const).map((cat) => {
          const isSel = selectedCategory === cat;
          const label = cat === 'todos' ? 'Todos os Hábitos' : CATEGORY_LABELS[cat].label;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isSel
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25'
                  : 'bg-[#0a142c] border-[#17284f] text-slate-300 hover:text-white hover:bg-[#122247]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Habit List */}
      <div className="space-y-3">
        {filteredHabits.length > 0 ? (
          filteredHabits.map((h) => {
            const isCompletedForDate = h.completedDates.includes(selectedDate);
            const streak = calculateHabitStreak(h);
            const catInfo = CATEGORY_LABELS[h.category] || CATEGORY_LABELS.geral;

            return (
              <div
                key={h.id}
                className={`bg-[#0a142c] border rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCompletedForDate
                    ? 'border-amber-500/40 bg-gradient-to-r from-[#0a142c] via-[#0d1c3e] to-[#0a142c]'
                    : 'border-[#1a2d56] hover:border-[#223b72]'
                }`}
              >
                {/* Left: Big Checkbox Toggle + Habit Details */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onToggleHabitDate(h.id, selectedDate)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                      isCompletedForDate
                        ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/35 hover:scale-105'
                        : 'bg-[#060c19] border-2 border-[#1a2d56] text-slate-500 hover:border-amber-400/60 hover:text-amber-400'
                    }`}
                    title={isCompletedForDate ? 'Desmarcar hábito' : 'Marcar hábito como concluído'}
                  >
                    {isCompletedForDate ? (
                      <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                    ) : (
                      <Circle className="w-6 h-6 stroke-[1.8]" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-white truncate">
                        {h.name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${catInfo.badgeClass}`}
                      >
                        {catInfo.label}
                      </span>
                      {streak > 0 && (
                        <span className="text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {streak} {streak === 1 ? 'dia' : 'dias'}
                        </span>
                      )}
                    </div>

                    {h.description && (
                      <p className="text-xs text-slate-300 mt-1 truncate">
                        {h.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Last 7 Days Strip & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#17284f]">
                  {/* 7-day mini visual history */}
                  <div className="flex items-center gap-1.5">
                    {last7Days.map((d) => {
                      const isDone = h.completedDates.includes(d.dateStr);
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => onToggleHabitDate(h.id, d.dateStr)}
                          className={`w-7 h-7 rounded-lg text-[10px] font-mono flex flex-col items-center justify-center transition-all ${
                            isDone
                              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm shadow-amber-400/40'
                              : 'bg-[#060c19] border border-[#17284f] text-slate-400 hover:border-slate-500'
                          }`}
                          title={`${d.dayLetter} (${d.dayNumber}): ${isDone ? 'Concluído' : 'Pendente'}`}
                        >
                          <span className="text-[8px] opacity-75">{d.dayLetter}</span>
                          <span className="leading-none">{d.dayNumber}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Edit / Delete triggers */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(h)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#122247] transition-colors"
                      title="Editar hábito"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteHabit(h.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-[#122247] transition-colors"
                      title="Excluir hábito"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-[#0a142c] border border-dashed border-[#1a2d56] rounded-3xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Nenhum hábito cadastrado nesta categoria</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Comece adicionando rituais diários para potencializar sua evolução, disciplina e saúde.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" /> Criar Hábito
            </button>
          </div>
        )}
      </div>

      {/* MODAL: CRIAR OU EDITAR HÁBITO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060f]/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0a142c] border border-[#1a2d56] rounded-3xl shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#17284f] flex items-center justify-between bg-[#081022]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Flame className="w-5 h-5 fill-amber-400/30" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingHabitId ? 'Editar Hábito' : 'Novo Hábito & Ritual'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Defina um hábito diário para acompanhar sua constância
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#122247] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome do Hábito *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tomar Creatina 5g, 10.000 Passos, Alongamento..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#060c19] border border-[#1a2d56] rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as HabitCategory)}
                    className="w-full px-3 py-2 bg-[#060c19] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="treino">🏋️ Treino & Físico</option>
                    <option value="nutricao">🥗 Nutrição & Dieta</option>
                    <option value="saude">💧 Saúde & Sono</option>
                    <option value="mente">🧠 Mente & Foco</option>
                    <option value="geral">⚡ Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Frequência Alvo
                  </label>
                  <select
                    value={formTargetDays}
                    onChange={(e) => setFormTargetDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#060c19] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value={7}>Todos os dias (7x/semana)</option>
                    <option value={6}>6 dias por semana</option>
                    <option value={5}>Dias de semana (5x/semana)</option>
                    <option value={4}>4 dias por semana</option>
                    <option value={3}>3 dias por semana</option>
                  </select>
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Ícone Representativo
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVAILABLE_ICONS.map((ic) => {
                    const IconComp = ic.icon;
                    const isSelected = formIcon === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setFormIcon(ic.name)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                            : 'bg-[#060c19] border-[#17284f] text-slate-400 hover:text-white hover:bg-[#122247]'
                        }`}
                        title={ic.label}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-[9px] truncate max-w-full">{ic.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Motivação / Nota (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tomar logo após o café para não esquecer"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#060c19] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#17284f]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#a16207]/40 bg-[#122247] hover:bg-[#182f61] text-amber-200 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!formName.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all"
                >
                  <Check className="w-4 h-4" />
                  {editingHabitId ? 'Salvar Alterações' : 'Criar Hábito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
