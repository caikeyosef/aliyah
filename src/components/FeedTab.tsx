import React, { useState, useMemo } from 'react';
import { FeedPost, FeedFilterType } from '../types/feed';
import { FeedCard } from './FeedCard';
import {
  Flame,
  Activity,
  Dumbbell,
  Search,
  Filter,
  PlusCircle,
  Trophy,
  TrendingUp,
  Sparkles,
  Calendar,
  X,
  Share2,
} from 'lucide-react';

interface FeedTabProps {
  posts: FeedPost[];
  userName: string;
  onToggleKudos: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onUpdatePost: (postId: string, title: string, note?: string) => void;
  onAddManualPost?: (post: FeedPost) => void;
  onNavigateToWorkouts?: () => void;
  onNavigateToRunning?: () => void;
}

export const FeedTab: React.FC<FeedTabProps> = ({
  posts,
  userName,
  onToggleKudos,
  onDeletePost,
  onUpdatePost,
  onAddManualPost,
  onNavigateToWorkouts,
  onNavigateToRunning,
}) => {
  const [filter, setFilter] = useState<FeedFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual Post State
  const [manualTitle, setManualTitle] = useState('');
  const [manualType, setManualType] = useState<'workout' | 'running_gpx'>('workout');
  const [manualDistance, setManualDistance] = useState('');
  const [manualDuration, setManualDuration] = useState('');
  const [manualPace, setManualPace] = useState('');
  const [manualVolume, setManualVolume] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  // Overall Stats Calculation
  const stats = useMemo(() => {
    let totalKm = 0;
    let totalVolumeKg = 0;
    let totalKudos = 0;
    let totalWorkouts = 0;
    let totalRuns = 0;

    posts.forEach((p) => {
      totalKudos += p.kudosCount || 0;
      if (p.type === 'running_gpx' && p.runningSummary) {
        totalKm += p.runningSummary.distanceKm || 0;
        totalRuns += 1;
      }
      if (p.type === 'workout' && p.workoutSummary) {
        totalVolumeKg += p.workoutSummary.totalVolumeKg || 0;
        totalWorkouts += 1;
      }
    });

    return {
      totalPosts: posts.length,
      totalKm,
      totalVolumeKg,
      totalKudos,
      totalWorkouts,
      totalRuns,
    };
  }, [posts]);

  // Filtered and Searched Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (filter === 'running' && p.type !== 'running_gpx') return false;
      if (filter === 'workout' && p.type !== 'workout') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesNote = p.userNote?.toLowerCase().includes(q);
        const matchesSubtitle = p.subtitle?.toLowerCase().includes(q);
        const matchesExercises = p.workoutSummary?.exercises.some((e) =>
          e.name.toLowerCase().includes(q)
        );
        return matchesTitle || matchesNote || matchesSubtitle || matchesExercises;
      }

      return true;
    });
  }, [posts, filter, searchQuery]);

  const handleCreateManualPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toISOString().slice(0, 10);

    const newPost: FeedPost = {
      id: `post-manual-${Date.now()}`,
      type: manualType,
      title: manualTitle.trim(),
      subtitle: manualType === 'running_gpx' ? 'Corrida Manual' : 'Treino de Força',
      date: dateStr,
      timeFormatted,
      timestamp: now.getTime(),
      userName: userName || 'Atleta Aliyah',
      userNote: manualNotes.trim() || undefined,
      kudosCount: 1,
      hasUserKudoed: true,
      createdAt: now.toISOString(),
    };

    if (manualType === 'running_gpx') {
      const dist = parseFloat(manualDistance) || 5.0;
      const dur = parseInt(manualDuration, 10) || 30;
      newPost.runningSummary = {
        activityId: `manual-run-${Date.now()}`,
        title: manualTitle.trim(),
        distanceKm: dist,
        durationSeconds: dur * 60,
        movingTimeFormatted: `${dur}m 00s`,
        avgPaceFormatted: manualPace.trim() || '5:30 /km',
        elevationGainM: 45,
        calories: Math.round(dist * 65),
      };
    } else {
      const vol = parseFloat(manualVolume) || 4500;
      const dur = parseInt(manualDuration, 10) || 45;
      newPost.workoutSummary = {
        workoutId: `manual-workout-${Date.now()}`,
        name: manualTitle.trim(),
        muscleGroups: ['Geral'],
        totalVolumeKg: vol,
        totalSets: 16,
        totalReps: 160,
        durationMinutes: dur,
        caloriesBurned: Math.round(dur * 6.5),
        exercises: [
          {
            id: 'ex-1',
            name: manualTitle.trim(),
            setsCount: 4,
            totalReps: 40,
            maxWeightKg: 80,
            volumeKg: vol,
            setsDetail: '4 séries completas',
          },
        ],
      };
    }

    if (onAddManualPost) {
      onAddManualPost(newPost);
    }
    setIsManualModalOpen(false);
    setManualTitle('');
    setManualDistance('');
    setManualDuration('');
    setManualPace('');
    setManualVolume('');
    setManualNotes('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* FEED HEADER & ATHLETIC HERO BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#071126] via-[#091530] to-[#050b18] border border-[#162a55] p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Athletic Amber Glow Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  Feed Pessoal de Atividades
                </span>
                <span className="text-xs text-slate-400">• Estilo Strava</span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight mt-2">
                Diário das Suas Conquistas
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
                Cada ficha de treino finalizada e trajeto GPX importado são salvos automaticamente aqui como publicações completas com mapa, altimetria, volume e métricas.
              </p>
            </div>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar Treino</span>
            </button>
          </div>

          {/* ATHLETIC SUMMARY STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#13254d]">
            <div className="bg-[#050c1c]/80 border border-[#14264f] p-3 rounded-2xl">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Atividades Salvas
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-heading font-black text-xl sm:text-2xl text-white">
                  {stats.totalPosts}
                </span>
                <span className="text-[11px] text-amber-400 font-bold">posts</span>
              </div>
            </div>

            <div className="bg-[#050c1c]/80 border border-[#14264f] p-3 rounded-2xl">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Percorrido
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-heading font-black text-xl sm:text-2xl text-white">
                  {stats.totalKm.toFixed(1)}
                </span>
                <span className="text-[11px] text-orange-400 font-bold">km</span>
              </div>
            </div>

            <div className="bg-[#050c1c]/80 border border-[#14264f] p-3 rounded-2xl">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Tonelagem Levantada
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-heading font-black text-xl sm:text-2xl text-white">
                  {(stats.totalVolumeKg / 1000).toFixed(1)}
                </span>
                <span className="text-[11px] text-amber-400 font-bold">toneladas</span>
              </div>
            </div>

            <div className="bg-[#050c1c]/80 border border-[#14264f] p-3 rounded-2xl">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Kudos Recebidos
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-heading font-black text-xl sm:text-2xl text-amber-400 flex items-center gap-1">
                  🔥 {stats.totalKudos}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#071024] p-3 rounded-2xl border border-[#14254b]">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-[#0a152e] text-slate-400 hover:text-white border border-[#15274d]'
            }`}
          >
            Todas ({posts.length})
          </button>

          <button
            onClick={() => setFilter('running')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              filter === 'running'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-[#0a152e] text-slate-400 hover:text-white border border-[#15274d]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Corridas GPX ({stats.totalRuns})</span>
          </button>

          <button
            onClick={() => setFilter('workout')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              filter === 'workout'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-[#0a152e] text-slate-400 hover:text-white border border-[#15274d]'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Musculação ({stats.totalWorkouts})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar atividade..."
            className="w-full bg-[#040916] border border-[#14264d] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* FEED POSTS TIMELINE */}
      <div className="space-y-6">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <FeedCard
              key={post.id}
              post={post}
              onToggleKudos={onToggleKudos}
              onDeletePost={onDeletePost}
              onUpdatePost={onUpdatePost}
            />
          ))
        ) : (
          <div className="p-8 sm:p-12 text-center rounded-3xl bg-[#070e20] border border-[#142347] space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <Flame className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white">
                {searchQuery || filter !== 'all'
                  ? 'Nenhuma atividade encontrada com esse filtro'
                  : 'Seu feed esportivo está pronto para começar!'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {searchQuery || filter !== 'all'
                  ? 'Tente remover a busca ou selecionar outro filtro para ver seus treinos e corridas.'
                  : 'Assim que você concluir uma ficha de treino de musculação ou salvar um trajeto de corrida GPX, eles aparecerão aqui automaticamente como publicações oficiais.'}
              </p>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onNavigateToWorkouts && (
                <button
                  onClick={onNavigateToWorkouts}
                  className="px-4 py-2.5 rounded-xl bg-[#0d1c3e] hover:bg-[#142b5d] border border-[#193264] text-xs font-bold text-amber-300 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Dumbbell className="w-4 h-4 text-amber-400" />
                  <span>Ir para Fichas de Treino</span>
                </button>
              )}
              {onNavigateToRunning && (
                <button
                  onClick={onNavigateToRunning}
                  className="px-4 py-2.5 rounded-xl bg-[#0d1c3e] hover:bg-[#142b5d] border border-[#193264] text-xs font-bold text-orange-300 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Activity className="w-4 h-4 text-orange-400" />
                  <span>Importar Rota GPX</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MANUAL POST MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03060f]/85 backdrop-blur-md safe-area-top safe-area-bottom">
          <div className="relative w-full max-w-md bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#16274e]">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-heading font-black text-base text-white">
                  Criar Publicação Manual
                </h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#122247] text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualPost} className="space-y-4 text-xs">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setManualType('workout')}
                  className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border cursor-pointer ${
                    manualType === 'workout'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-[#060c19] text-slate-400 border-[#142347]'
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>Musculação</span>
                </button>

                <button
                  type="button"
                  onClick={() => setManualType('running_gpx')}
                  className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border cursor-pointer ${
                    manualType === 'running_gpx'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-[#060c19] text-slate-400 border-[#142347]'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Corrida</span>
                </button>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Título da Atividade *
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder={manualType === 'running_gpx' ? 'Ex: Corrida Matinal no Parque' : 'Ex: Ficha A - Peito e Tríceps Pesado'}
                  className="w-full bg-[#060c19] border border-[#14254d] rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              {manualType === 'running_gpx' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Distância (km)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualDistance}
                      onChange={(e) => setManualDistance(e.target.value)}
                      placeholder="5.0"
                      className="w-full bg-[#060c19] border border-[#14254d] rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Duração (min)
                    </label>
                    <input
                      type="number"
                      value={manualDuration}
                      onChange={(e) => setManualDuration(e.target.value)}
                      placeholder="28"
                      className="w-full bg-[#060c19] border border-[#14254d] rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Ritmo (Pace)
                    </label>
                    <input
                      type="text"
                      value={manualPace}
                      onChange={(e) => setManualPace(e.target.value)}
                      placeholder="5:35 /km"
                      className="w-full bg-[#060c19] border border-[#14254d] rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Volume Levantado (kg)
                    </label>
                    <input
                      type="number"
                      value={manualVolume}
                      onChange={(e) => setManualVolume(e.target.value)}
                      placeholder="6500"
                      className="w-full bg-[#060c19] border border-[#14254d] rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Duração (min)
                    </label>
                    <input
                      type="number"
                      value={manualDuration}
                      onChange={(e) => setManualDuration(e.target.value)}
                      placeholder="50"
                      className="w-full bg-[#060c19] border border-[#14254d] rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Notas & Sensações (Opcional)
                </label>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Como você se sentiu nesse treino? Algum PR ou observação?"
                  className="w-full bg-[#060c19] border border-[#14254d] rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Publicar no Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
