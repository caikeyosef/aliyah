import React, { useState, useMemo } from 'react';
import { FeedPost } from '../types/feed';
import {
  Flame,
  Heart,
  Dumbbell,
  Activity,
  Share2,
  Trash2,
  MoreVertical,
  Trophy,
  Clock,
  Zap,
  TrendingUp,
  MapPin,
  ChevronDown,
  ChevronUp,
  Check,
  Edit2,
  MessageSquare,
  Copy,
} from 'lucide-react';

interface FeedCardProps {
  post: FeedPost;
  onToggleKudos: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onUpdatePost: (postId: string, title: string, note?: string) => void;
  onOpenStoryShare: (post: FeedPost) => void;
}

export const FeedCard: React.FC<FeedCardProps> = ({
  post,
  onToggleKudos,
  onDeletePost,
  onUpdatePost,
  onOpenStoryShare,
}) => {
  const [showSplits, setShowSplits] = useState(false);
  const [showAllExercises, setShowAllExercises] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editNote, setEditNote] = useState(post.userNote || '');
  const [copiedToast, setCopiedToast] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [localComments, setLocalComments] = useState<string[]>([]);

  const isRunning = post.type === 'running_gpx';
  const isWorkout = post.type === 'workout';

  // Format relative date or full date
  const formattedDate = useMemo(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      if (post.date === today) {
        return `Hoje às ${post.timeFormatted || '10:00'}`;
      } else if (post.date === yesterday) {
        return `Ontem às ${post.timeFormatted || '10:00'}`;
      }

      const [y, m, d] = post.date.split('-');
      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const monthName = months[parseInt(m, 10) - 1] || m;
      return `${d} de ${monthName} • ${post.timeFormatted || ''}`;
    } catch {
      return post.date;
    }
  }, [post.date, post.timeFormatted]);

  // Compute SVG track path for running route
  const svgPathData = useMemo(() => {
    if (!post.runningSummary?.routePolylinePoints || post.runningSummary.routePolylinePoints.length < 2) {
      return null;
    }

    const points = post.runningSummary.routePolylinePoints;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    points.forEach((p) => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });

    const latSpan = maxLat - minLat || 0.001;
    const lngSpan = maxLng - minLng || 0.001;

    // ViewBox: 400 x 240
    const padding = 24;
    const width = 400 - padding * 2;
    const height = 240 - padding * 2;

    const coords = points.map((p) => {
      const x = padding + ((p.lng - minLng) / lngSpan) * width;
      // Invert Y because latitude goes north/up
      const y = padding + height - ((p.lat - minLat) / latSpan) * height;
      return { x, y };
    });

    const d = coords.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }, '');

    return {
      path: d,
      start: coords[0],
      finish: coords[coords.length - 1],
    };
  }, [post.runningSummary?.routePolylinePoints]);

  const handleSaveEdit = () => {
    onUpdatePost(post.id, editTitle, editNote);
    setIsEditing(false);
  };

  const handleShare = () => {
    let text = `🔥 ${post.title} no Aliyah!\n📅 ${formattedDate}\n`;
    if (isRunning && post.runningSummary) {
      text += `🏃 ${post.runningSummary.distanceKm.toFixed(2)} km • Ritmo: ${post.runningSummary.avgPaceFormatted} • Tempo: ${post.runningSummary.movingTimeFormatted}\n⛰️ +${post.runningSummary.elevationGainM}m • 🔥 ${post.runningSummary.calories} kcal`;
    } else if (isWorkout && post.workoutSummary) {
      text += `🏋️ Volume Total: ${post.workoutSummary.totalVolumeKg.toLocaleString('pt-BR')} kg\n⏱️ ${post.workoutSummary.durationMinutes} min • ${post.workoutSummary.totalSets} séries • 🔥 ${post.workoutSummary.caloriesBurned} kcal`;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setLocalComments((prev) => [...prev, commentInput.trim()]);
    setCommentInput('');
  };

  return (
    <article className="relative bg-gradient-to-b from-[#0a142c] to-[#070e20] border border-[#16274e] rounded-3xl overflow-hidden shadow-xl hover:border-amber-500/30 transition-all duration-300">
      {/* CARD HEADER: User, Timestamp, Sport Badge */}
      <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar / Initials with Sport Ring */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-amber-500/25">
              {post.userName ? post.userName.slice(0, 2).toUpperCase() : 'AL'}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center text-[10px] text-white shadow-md ${
              isRunning ? 'bg-orange-500' : 'bg-amber-600'
            }`}>
              {isRunning ? <Activity className="w-3 h-3" /> : <Dumbbell className="w-3 h-3" />}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                {post.userName}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isRunning
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {isRunning ? 'Corrida • GPX' : 'Musculação • Treino'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formattedDate}</span>
            </p>
          </div>
        </div>

        {/* Options Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 rounded-xl bg-[#0e1c3d]/60 hover:bg-[#142857] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Opções da publicação"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-10 w-52 bg-[#081228] border border-[#1b3160] rounded-2xl p-1.5 shadow-2xl z-20 space-y-1">
              <button
                onClick={() => {
                  onOpenStoryShare(post);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-gradient-to-r hover:from-pink-600/25 hover:to-orange-500/25 flex items-center gap-2 cursor-pointer border-b border-[#14264f]/60"
              >
                <div className="w-4 h-4 rounded bg-gradient-to-tr from-[#f09433] via-[#bc1888] to-[#cc2366] flex items-center justify-center text-[10px] text-white">
                  📸
                </div>
                <span>Stories do Instagram</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#122349] flex items-center gap-2 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Editar Legenda</span>
              </button>
              <button
                onClick={() => {
                  handleShare();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#122349] flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Copiar Resumo em Texto</span>
              </button>
              <button
                onClick={() => {
                  onDeletePost(post.id);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir do Feed</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* POST TITLE & CAPTION */}
      <div className="px-4 sm:px-5 pb-3">
        {isEditing ? (
          <div className="space-y-2 bg-[#060c19] p-3 rounded-2xl border border-amber-500/30">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-[#0b1736] border border-[#172c5c] rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
              placeholder="Título da atividade"
            />
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="w-full bg-[#0b1736] border border-[#172c5c] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none h-16"
              placeholder="Como foi o treino? Deixe suas notas aqui..."
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-heading font-black text-lg sm:text-xl text-white tracking-tight leading-snug">
              {post.title}
            </h3>
            {post.subtitle && (
              <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                {post.subtitle}
              </p>
            )}
            {post.userNote && (
              <p className="text-xs sm:text-sm text-slate-300 mt-2 bg-[#060d1e]/70 p-3 rounded-2xl border border-[#112044] leading-relaxed">
                “{post.userNote}”
              </p>
            )}
          </div>
        )}
      </div>

      {/* HERO METRICS STRIP (STRAVA STYLE) */}
      <div className="px-4 sm:px-5 py-3 border-y border-[#122245] bg-[#050b1a]/60">
        {isRunning && post.runningSummary && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 text-left">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Distância
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
                  {post.runningSummary.distanceKm.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-amber-400">km</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Ritmo Médio
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
                  {post.runningSummary.avgPaceFormatted.replace(' /km', '')}
                </span>
                <span className="text-xs font-bold text-amber-400">/km</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Tempo
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
                  {post.runningSummary.movingTimeFormatted}
                </span>
              </div>
            </div>

            <div className="hidden sm:block">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Elevação
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
                  +{post.runningSummary.elevationGainM}
                </span>
                <span className="text-xs font-bold text-amber-400">m</span>
              </div>
            </div>
          </div>
        )}

        {isWorkout && post.workoutSummary && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 text-left">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Volume Total
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
                  {post.workoutSummary.totalVolumeKg.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs font-bold text-amber-400">kg</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Duração
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
                  {post.workoutSummary.durationMinutes}
                </span>
                <span className="text-xs font-bold text-amber-400">min</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Séries Válidas
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
                  {post.workoutSummary.totalSets}
                </span>
                <span className="text-xs font-bold text-amber-400">sets</span>
              </div>
            </div>

            <div className="hidden sm:block">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Calorias
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
                  ~{post.workoutSummary.caloriesBurned}
                </span>
                <span className="text-xs font-bold text-amber-400">kcal</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VISUAL SHOWCASE: GPX Route Path Map OR Workout Exercise Breakdown */}
      {isRunning && (
        <div className="p-4 sm:p-5 pt-3 space-y-3">
          {/* SVG Vector Path Strava Card */}
          {svgPathData ? (
            <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-[#040813] border border-[#132448] overflow-hidden flex items-center justify-center shadow-inner group">
              {/* Subtle athletic coordinate grid lines */}
              <div className="absolute inset-0 bg-[radial-gradient(#182a52_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

              {/* Glowing Route SVG */}
              <svg
                viewBox="0 0 400 240"
                className="w-full h-full relative z-10 p-2 overflow-visible"
              >
                <defs>
                  <linearGradient id={`routeGradient-${post.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                  <filter id={`glow-${post.id}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Soft glow background polyline */}
                <path
                  d={svgPathData.path}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.35"
                  filter={`url(#glow-${post.id})`}
                />

                {/* Crisp sharp athletic polyline */}
                <path
                  d={svgPathData.path}
                  fill="none"
                  stroke={`url(#routeGradient-${post.id})`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Start Marker (Green) */}
                {svgPathData.start && (
                  <g transform={`translate(${svgPathData.start.x}, ${svgPathData.start.y})`}>
                    <circle r="7" fill="#10b981" stroke="#040813" strokeWidth="2.5" />
                    <circle r="2.5" fill="#ffffff" />
                  </g>
                )}

                {/* Finish Marker (Amber Checkered) */}
                {svgPathData.finish && (
                  <g transform={`translate(${svgPathData.finish.x}, ${svgPathData.finish.y})`}>
                    <circle r="8" fill="#f59e0b" stroke="#040813" strokeWidth="2.5" />
                    <circle r="3" fill="#040813" />
                  </g>
                )}
              </svg>

              {/* Overlay badges */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-[#060c1c]/90 border border-[#1b315f] text-[11px] font-bold text-white flex items-center gap-1.5 backdrop-blur-md">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>Trajeto GPS</span>
                </span>
                {post.runningSummary?.calories && (
                  <span className="px-2.5 py-1 rounded-xl bg-[#060c1c]/90 border border-[#1b315f] text-[11px] font-bold text-amber-400 flex items-center gap-1.5 backdrop-blur-md">
                    <Zap className="w-3 h-3" />
                    <span>{post.runningSummary.calories} kcal</span>
                  </span>
                )}
              </div>

              {/* Elev / Pace Bottom Overlay */}
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-[#060c1c]/90 border border-[#1b315f] text-[11px] font-semibold text-slate-300 flex items-center gap-1 backdrop-blur-md">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>+{post.runningSummary?.elevationGainM}m</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#060d1e] border border-[#142347] flex items-center justify-between text-xs text-slate-300">
              <span>Arquivo GPX: {post.runningSummary?.filename || 'Trilha salva'}</span>
              <span className="font-bold text-amber-400">{post.runningSummary?.distanceKm.toFixed(2)} km</span>
            </div>
          )}

          {/* Splits expander */}
          {post.runningSummary?.splits && post.runningSummary.splits.length > 0 && (
            <div>
              <button
                onClick={() => setShowSplits(!showSplits)}
                className="w-full py-2 px-3 rounded-xl bg-[#081228] hover:bg-[#0f1f42] border border-[#15274e] text-xs font-bold text-slate-300 hover:text-white flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver Parciais por Quilômetro ({post.runningSummary.splits.length} km)</span>
                </span>
                {showSplits ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSplits && (
                <div className="mt-2 p-3 rounded-2xl bg-[#060c19] border border-[#132347] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs animate-in fade-in duration-200">
                  {post.runningSummary.splits.map((split) => (
                    <div
                      key={split.km}
                      className={`p-2 rounded-xl flex items-center justify-between ${
                        split.isFastest
                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold'
                          : 'bg-[#09142b] border border-[#112044] text-slate-300'
                      }`}
                    >
                      <span>Km {split.km}</span>
                      <div className="flex items-center gap-1">
                        <span>{split.paceFormatted}</span>
                        {split.isFastest && <span title="Quilômetro mais rápido">⚡</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isWorkout && post.workoutSummary && (
        <div className="p-4 sm:p-5 pt-3 space-y-3">
          {/* PR / Record Badge if any */}
          {post.workoutSummary.prsAchieved && post.workoutSummary.prsAchieved.length > 0 && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300 font-bold">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="text-white block font-black">Recorde Pessoal Batido!</span>
                <span className="text-[11px] text-amber-300/90 font-normal">
                  {post.workoutSummary.prsAchieved.join(' • ')}
                </span>
              </div>
            </div>
          )}

          {/* Muscle Focus Tags */}
          {post.workoutSummary.muscleGroups.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.workoutSummary.muscleGroups.map((mg) => (
                <span
                  key={mg}
                  className="px-2.5 py-0.5 rounded-lg bg-[#0e1c3b] border border-[#19305e] text-[11px] font-bold text-slate-300 uppercase tracking-wide"
                >
                  #{mg}
                </span>
              ))}
            </div>
          )}

          {/* Exercises Breakdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
              <span>Exercícios Executados</span>
              <span>{post.workoutSummary.exercises.length} movimentos</span>
            </div>

            <div className="space-y-1.5">
              {(showAllExercises
                ? post.workoutSummary.exercises
                : post.workoutSummary.exercises.slice(0, 3)
              ).map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  className="p-2.5 sm:p-3 rounded-xl bg-[#060c19] border border-[#132347] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">{ex.name}</span>
                      {ex.isPr && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black">
                          PR
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {ex.setsDetail}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-amber-400 text-xs">
                      {ex.maxWeightKg > 0 ? `${ex.maxWeightKg} kg máx` : `${ex.totalReps} reps`}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">
                      {ex.setsCount} séries
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {post.workoutSummary.exercises.length > 3 && (
              <button
                onClick={() => setShowAllExercises(!showAllExercises)}
                className="w-full py-1.5 text-center text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer pt-1"
              >
                {showAllExercises
                  ? 'Ver menos'
                  : `+ Ver outros ${post.workoutSummary.exercises.length - 3} exercícios`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* CARD ENGAGEMENT FOOTER (KUDOS, COMMENTS, SHARE) */}
      <div className="px-4 sm:px-5 py-3 border-t border-[#122245] bg-[#050b1a] flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Kudos / Like Button */}
          <button
            onClick={() => onToggleKudos(post.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              post.hasUserKudoed
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'bg-[#0a152e] hover:bg-[#12244d] text-slate-400 hover:text-white border border-[#152a55]'
            }`}
          >
            <Flame
              className={`w-4 h-4 ${
                post.hasUserKudoed ? 'fill-amber-400 text-amber-400 scale-110' : 'text-slate-400'
              } transition-all`}
            />
            <span>{post.hasUserKudoed ? 'Kudos dado!' : 'Dar Kudos'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-md bg-[#040814] text-[10px] font-black text-amber-400">
              {post.kudosCount}
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            {/* Stories Button (Instagram) */}
            <button
              onClick={() => onOpenStoryShare(post)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#f09433]/25 via-[#bc1888]/25 to-[#cc2366]/25 hover:from-[#f09433]/40 hover:via-[#bc1888]/40 hover:to-[#cc2366]/40 text-pink-200 hover:text-white border border-pink-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-pink-500/10"
              title="Compartilhar no Instagram Stories"
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#f09433] via-[#bc1888] to-[#cc2366] flex items-center justify-center text-[9px] text-white shrink-0">
                <Share2 className="w-2.5 h-2.5" />
              </div>
              <span>Stories</span>
            </button>

            {/* Quick Share / Copy Text Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0a152e] hover:bg-[#12244d] text-slate-300 hover:text-white border border-[#152a55] text-xs font-semibold transition-all cursor-pointer"
              title="Copiar texto da atividade"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden sm:inline">{copiedToast ? 'Copiado!' : 'Texto'}</span>
            </button>
          </div>
        </div>

        {/* Existing Local Comments / Notes */}
        {localComments.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {localComments.map((c, i) => (
              <div key={i} className="text-xs bg-[#070e20] p-2 rounded-xl border border-[#112042] text-slate-300">
                <span className="font-bold text-amber-400 mr-1.5">{post.userName}:</span>
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Add quick note / comment input */}
        <form onSubmit={handleAddComment} className="pt-1 flex items-center gap-2">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Adicionar nota pessoal sobre este treino..."
            className="flex-1 bg-[#070e20] border border-[#132448] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!commentInput.trim()}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            Publicar
          </button>
        </form>
      </div>
    </article>
  );
};
