import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Activity,
  Mountain,
  Heart,
  Timer,
  Flame,
  Zap,
  Gauge,
  Trophy,
  Table,
  CheckCircle2,
  Trash2,
  Save,
  Download,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
  Footprints,
  Pencil,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { GPXActivity, KmSplit } from '../types/running';
import { parseGPX, formatPace, formatDuration } from '../utils/gpxParser';
import { RunningRouteMap } from './RunningRouteMap';
import { RunningElevationChart } from './RunningElevationChart';
import { loadStoredRuns, saveStoredRuns } from '../utils/storage';
import { UserProfile } from '../types/fitness';
import { RunnaCoachTab } from './RunnaCoachTab';

interface RunningTabProps {
  profile: UserProfile;
}

type SubTab = 'overview' | 'splits' | 'hr_zones' | 'best_efforts' | 'raw_data';

export const RunningTab: React.FC<RunningTabProps> = ({ profile }) => {
  const [runningMode, setRunningMode] = useState<'runna_coach' | 'gpx_analyzer'>('runna_coach');
  const [activity, setActivity] = useState<GPXActivity | null>(null);
  const [savedRuns, setSavedRuns] = useState<GPXActivity[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Editable Title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Raw data pagination / search
  const [rawSearchQuery, setRawSearchQuery] = useState('');
  const [rawPage, setRawPage] = useState(1);
  const rawPageSize = 50;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved runs on mount (No fake samples)
  useEffect(() => {
    const stored = loadStoredRuns();
    setSavedRuns(stored);
    if (stored.length > 0) {
      setActivity(stored[0]);
    } else {
      setActivity(null);
    }
  }, []);

  // Parse GPX text
  const handleProcessGpxString = (xmlString: string, filename: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      try {
        const parsed = parseGPX(
          xmlString,
          filename,
          profile.currentWeight || 72,
          profile.age || 28
        );
        setActivity(parsed);
        setIsEditingTitle(false);
        setHoveredPointIndex(null);
        setRawPage(1);
      } catch (err: any) {
        setErrorMessage(err.message || 'Erro ao processar o arquivo GPX.');
      } finally {
        setIsLoading(false);
      }
    }, 50);
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setErrorMessage('Por favor, selecione um arquivo válido com extensão .gpx');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleProcessGpxString(content, file.name);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Erro ao ler o arquivo no seu navegador.');
    };
    reader.readAsText(file);
    // Reset file input so re-selecting same file triggers change
    e.target.value = '';
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setErrorMessage('Por favor, solte um arquivo com extensão .gpx');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleProcessGpxString(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  // Save Activity to History
  const handleSaveActivity = () => {
    if (!activity) return;

    const exists = savedRuns.some((r) => r.id === activity.id);
    let updated: GPXActivity[];

    if (exists) {
      updated = savedRuns.map((r) => (r.id === activity.id ? activity : r));
    } else {
      updated = [activity, ...savedRuns];
    }

    setSavedRuns(updated);
    saveStoredRuns(updated);

    setSaveSuccessNotice('Corrida salva no seu histórico com sucesso!');
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  // Delete saved run
  const handleDeleteSavedRun = (runId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedRuns.filter((r) => r.id !== runId);
    setSavedRuns(updated);
    saveStoredRuns(updated);
    if (activity?.id === runId) {
      if (updated.length > 0) {
        setActivity(updated[0]);
      } else {
        setActivity(null);
      }
    }
  };

  // Title edit
  const handleStartEditTitle = () => {
    if (!activity) return;
    setEditTitleValue(activity.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (!activity) return;
    const trimmed = editTitleValue.trim() || 'Corrida de Rua';
    const updated = { ...activity, title: trimmed };
    setActivity(updated);
    setIsEditingTitle(false);

    // Also update in savedRuns if already saved
    if (savedRuns.some((r) => r.id === activity.id)) {
      const updatedList = savedRuns.map((r) => (r.id === activity.id ? updated : r));
      setSavedRuns(updatedList);
      saveStoredRuns(updatedList);
    }
  };

  // Export JSON Report
  const handleExportActivityReport = () => {
    if (!activity) return;
    const report = {
      title: activity.title,
      date: activity.date,
      startTime: activity.startTimeFormatted,
      creator: activity.creator,
      metrics: {
        totalDistanceKm: activity.totalDistanceKm,
        movingTime: formatDuration(activity.movingTimeSeconds),
        totalTime: formatDuration(activity.totalTimeSeconds),
        averagePace: activity.movingPaceFormatted,
        bestPace: activity.bestPaceFormatted,
        elevationGainM: activity.elevationGainM,
        elevationLossM: activity.elevationLossM,
        gapPace: activity.gapPaceFormatted,
        calories: activity.estimatedCalories,
        avgHeartRate: activity.avgHeartRate,
        maxHeartRate: activity.maxHeartRate,
        avgCadence: activity.avgCadence,
      },
      splits: activity.splits,
      bestEfforts: activity.bestEfforts,
      pointsCount: activity.pointsCount,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-corrida-${activity.date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Total Outdoor Volume Summary
  const totalVolumeStats = savedRuns.reduce(
    (acc, curr) => ({
      km: acc.km + curr.totalDistanceKm,
      timeSec: acc.timeSec + curr.movingTimeSeconds,
      calories: acc.calories + curr.estimatedCalories,
      elevM: acc.elevM + curr.elevationGainM,
    }),
    { km: 0, timeSec: 0, calories: 0, elevM: 0 }
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* MASTER CORRIDA MODE SWITCHER: Runna Coach vs GPX Strava Analyzer */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-[#060c1a] border border-[#17284f] shadow-2xl">
          <button
            onClick={() => setRunningMode('runna_coach')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              runningMode === 'runna_coach'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Footprints className="w-4 h-4 stroke-[2.5]" />
            <span>Treinador Runna (Planos & Sessões)</span>
          </button>

          <button
            onClick={() => setRunningMode('gpx_analyzer')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              runningMode === 'gpx_analyzer'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 stroke-[2.5]" />
            <span>Telemetria GPX (Strava Premium)</span>
          </button>
        </div>
      </div>

      {runningMode === 'runna_coach' ? (
        <RunnaCoachTab onOpenGpxAnalyzer={() => setRunningMode('gpx_analyzer')} />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx,application/gpx+xml"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* TOP HERO BANNER & UPLOAD STRIP */}
          <div className="relative bg-gradient-to-br from-[#071126] via-[#091530] to-[#040915] border border-[#17284f] rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Activity className="w-5 h-5" />
                  </span>
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">
                  STRAVA PREMIUM EXPERIENCE • GPX ANALYZER
                </span>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  Corrida de Rua & Telemetria GPX
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Arraste seu arquivo <code className="text-amber-300 font-mono">.gpx</code> gravado em
              relógios Garmin, Apple Watch, Strava, Polar ou Coros. Obtenha altimetria, parciais por
              quilômetro, zonas cardíacas, ritmo ajustado à inclinação (GAP) e mapa interativo.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>Importar Arquivo GPX</span>
            </button>
          </div>
        </div>

        {/* Drag & drop overlay zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-4 border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-[#17284f] hover:border-amber-500/40 bg-[#060c1a]/60'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>
              {isDragging
                ? 'Solte o arquivo GPX aqui para analisar...'
                : 'Ou arraste e solte seu arquivo .gpx direto aqui'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start justify-between gap-3 animate-in fade-in">
          <div>
            <span className="font-bold">Aviso: </span>
            {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded text-rose-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Notice */}
      {saveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessNotice}</span>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(null)}
            className="p-1 rounded text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN ACTIVITY CONTENT */}
      {activity ? (
        <div className="space-y-6">
          {/* STRAVA HEADER BAR: Title, Date, Device, Actions */}
          <div className="bg-[#091329] border border-[#17284f] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              {/* Title row */}
              <div className="flex items-center gap-2.5">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 max-w-lg w-full">
                    <input
                      type="text"
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                      className="flex-1 bg-[#050a18] border border-amber-500/60 rounded-xl px-3 py-1.5 text-base font-bold text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTitle}
                      className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:brightness-110"
                      title="Salvar Nome"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      className="p-2 rounded-xl bg-[#122247] text-slate-300 hover:text-white"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h2 className="text-lg sm:text-2xl font-black text-white truncate tracking-tight">
                      {activity.title}
                    </h2>
                    <button
                      onClick={handleStartEditTitle}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-[#122247] transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                      title="Editar Nome da Corrida"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Typographic Metadata Line (No generic pill slop) */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {new Date(activity.date).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span>Início às {activity.startTimeFormatted}</span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="text-slate-300 font-medium">
                  {activity.creator || 'Dispositivo GPS'}
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span>{activity.pointsCount.toLocaleString('pt-BR')} pontos gravados</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSaveActivity}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0e1d3c] hover:bg-[#162c5b] border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Salvar esta corrida no seu histórico local"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Salvar Corrida</span>
              </button>

              <button
                onClick={handleExportActivityReport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#091329] hover:bg-[#122247] border border-[#1a2d56] text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Baixar Relatório JSON com todas as parciais e métricas"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Exportar Relatório</span>
              </button>
            </div>
          </div>

          {/* STRAVA PRIMARY KEY METRICS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Distância */}
            <div className="bg-[#091329] border border-[#17284f] rounded-2xl p-4 shadow-md space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                Distância
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activity.totalDistanceKm}
                <span className="text-sm font-bold text-slate-400 ml-1">km</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {activity.totalDistanceM.toLocaleString('pt-BR')} metros
              </div>
            </div>

            {/* Tempo em Movimento */}
            <div className="bg-[#091329] border border-[#17284f] rounded-2xl p-4 shadow-md space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-emerald-400" />
                Tempo Movimento
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatDuration(activity.movingTimeSeconds)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Total: {formatDuration(activity.totalTimeSeconds)}
              </div>
            </div>

            {/* Ritmo Médio */}
            <div className="bg-[#091329] border border-[#17284f] rounded-2xl p-4 shadow-md space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Ritmo Médio
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activity.movingPaceFormatted.replace(' /km', '')}
                <span className="text-sm font-bold text-slate-400 ml-1">/km</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Melhor: {activity.bestPaceFormatted}
              </div>
            </div>

            {/* Elevação (D+) */}
            <div className="bg-[#091329] border border-[#17284f] rounded-2xl p-4 shadow-md space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5 text-sky-400" />
                Ganho Elevação
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                +{activity.elevationGainM}
                <span className="text-sm font-bold text-slate-400 ml-1">m</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Perda: -{activity.elevationLossM}m
              </div>
            </div>

            {/* Ritmo Ajustado GAP */}
            <div className="bg-[#091329] border border-[#17284f] rounded-2xl p-4 shadow-md space-y-1">
              <span
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 cursor-help"
                title="Grade Adjusted Pace: ritmo que você teria se o percurso fosse 100% plano, compensando o esforço de subidas e descidas"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                Ritmo GAP
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
                {activity.gapPaceFormatted.replace(' /km', '')}
                <span className="text-sm font-bold text-slate-400 ml-1">/km</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Esforço plano equiv.</div>
            </div>

            {/* Calorias Estimadas */}
            <div className="bg-[#091329] border border-[#17284f] rounded-2xl p-4 shadow-md space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Gasto Calórico
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activity.estimatedCalories}
                <span className="text-sm font-bold text-slate-400 ml-1">kcal</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Baseado no peso & altim.</div>
            </div>
          </div>

          {/* SECONDARY ROW: Heart Rate, Cadence, Speed */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Heart Rate */}
            <div className="bg-[#091329] border border-[#17284f] rounded-2xl p-4 shadow-md flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  Freq. Cardíaca
                </span>
                <div className="text-xl sm:text-2xl font-black text-white">
                  {activity.avgHeartRate ? `${activity.avgHeartRate} bpm` : 'Não registrado'}
                </div>
                <div className="text-xs text-slate-400">
                  {activity.maxHeartRate ? `Máxima de ${activity.maxHeartRate} bpm` : 'Sem sensor de FC'}
                </div>
              </div>
              {activity.hasHeartRate && (
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
                  <Heart className="w-6 h-6 animate-pulse" />
                </div>
              )}
            </div>

            {/* Cadence */}
            <div className="bg-[#091329] border border-[#17284f] rounded-2xl p-4 shadow-md flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Footprints className="w-3.5 h-3.5 text-indigo-400" />
                  Cadência Média
                </span>
                <div className="text-xl sm:text-2xl font-black text-white">
                  {activity.avgCadence ? `${activity.avgCadence} spm` : '168 spm (estimado)'}
                </div>
                <div className="text-xs text-slate-400">
                  {activity.avgStrideLengthM
                    ? `Passada: ${activity.avgStrideLengthM}m`
                    : 'Passos por minuto'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Footprints className="w-6 h-6" />
              </div>
            </div>

            {/* Velocity */}
            <div className="bg-[#091329] border border-[#17284f] rounded-2xl p-4 shadow-md flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  Velocidade
                </span>
                <div className="text-xl sm:text-2xl font-black text-white">
                  {activity.averageSpeedKmh} <span className="text-sm font-bold text-slate-400">km/h</span>
                </div>
                <div className="text-xs text-slate-400">
                  Pico Máximo: {activity.maxSpeedKmh} km/h
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                <Gauge className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* INTERACTIVE SUB-TABS NAVIGATION (Segmented Control) */}
          <div className="flex items-center gap-1.5 p-1.5 bg-[#070d1e] rounded-2xl border border-[#17284f] overflow-x-auto select-none">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-[#122247]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Rota & Altimetria</span>
            </button>

            <button
              onClick={() => setActiveSubTab('splits')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'splits'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-[#122247]'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Parciais por KM ({activity.splits.length})</span>
            </button>

            {activity.hasHeartRate && (
              <button
                onClick={() => setActiveSubTab('hr_zones')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeSubTab === 'hr_zones'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-[#122247]'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Zonas Cardíacas</span>
              </button>
            )}

            <button
              onClick={() => setActiveSubTab('best_efforts')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'best_efforts'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-[#122247]'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Melhores Esforços</span>
            </button>

            <button
              onClick={() => setActiveSubTab('raw_data')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'raw_data'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-[#122247]'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Dados Brutos GPX ({activity.pointsCount})</span>
            </button>
          </div>

          {/* SUB-TAB 1: OVERVIEW (MAP + ELEVATION SCRUBBER) */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              {/* Interactive Route Map */}
              <RunningRouteMap
                activity={activity}
                hoveredPointIndex={hoveredPointIndex}
                onPointHover={setHoveredPointIndex}
              />

              {/* Synchronized Profile Chart */}
              <RunningElevationChart
                activity={activity}
                hoveredPointIndex={hoveredPointIndex}
                onHoverPoint={setHoveredPointIndex}
              />
            </div>
          )}

          {/* SUB-TAB 2: KM SPLITS (PARCIAIS STRAVA STYLE) */}
          {activeSubTab === 'splits' && (
            <div className="bg-[#091329] border border-[#17284f] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#142344]">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Timer className="w-5 h-5 text-amber-400" />
                    Parciais por Quilômetro (Splits)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ritmo exato, variação de altimetria e frequência cardíaca registrada em cada
                    quilômetro.
                  </p>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500"></span> Mais Rápido
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500"></span> Mais Lento
                  </span>
                </div>
              </div>

              {/* Splits List / Table */}
              <div className="space-y-2">
                {activity.splits.map((split) => {
                  // Bar width relative to average
                  const paceRatio = split.paceSeconds / (activity.movingPaceSeconds || 300);
                  const isFastest = split.isFastest;
                  const isSlowest = split.isSlowest;

                  return (
                    <div
                      key={split.km}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                        isFastest
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                          : isSlowest
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-[#060c19] border-[#142344] hover:border-[#1d3568]'
                      }`}
                    >
                      {/* Left: KM label & distance */}
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                            isFastest
                              ? 'bg-emerald-500 text-slate-950'
                              : isSlowest
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-[#122247] text-white'
                          }`}
                        >
                          {split.km}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span>KM {split.km}</span>
                            {isFastest && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                Melhor Pace ⚡
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {split.distanceM < 1000 ? `${split.distanceM}m (final)` : '1.000m'}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Visual Pace Bar */}
                      <div className="flex-1 max-w-md hidden md:block">
                        <div className="w-full bg-[#0a142c] rounded-full h-3 overflow-hidden p-0.5 border border-[#17284f]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFastest
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : isSlowest
                                ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                                : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(25, 100 - (paceRatio - 0.7) * 90))}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Right: Metrics */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 text-xs">
                        <div className="text-right">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">
                            Ritmo
                          </span>
                          <span
                            className={`text-sm sm:text-base font-black ${
                              isFastest
                                ? 'text-emerald-300'
                                : isSlowest
                                ? 'text-amber-300'
                                : 'text-white'
                            }`}
                          >
                            {split.paceFormatted}
                          </span>
                        </div>

                        <div className="text-right min-w-[70px]">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">
                            Altimetria
                          </span>
                          <span
                            className={`font-bold ${
                              split.elevationDiffM > 0
                                ? 'text-rose-400'
                                : split.elevationDiffM < 0
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {split.elevationDiffM > 0 ? `+${split.elevationDiffM}m` : `${split.elevationDiffM}m`}
                          </span>
                        </div>

                        {split.avgHr && (
                          <div className="text-right min-w-[60px]">
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">
                              FC Média
                            </span>
                            <span className="font-bold text-rose-300">{split.avgHr} bpm</span>
                          </div>
                        )}

                        {split.avgCadence && (
                          <div className="text-right min-w-[55px] hidden sm:block">
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">
                              Cadência
                            </span>
                            <span className="font-bold text-indigo-300">{split.avgCadence}</span>
                          </div>
                        )}

                        <div className="text-right min-w-[60px]">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">
                            Tempo
                          </span>
                          <span className="font-bold text-slate-300">
                            {formatDuration(split.timeSeconds)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: HEART RATE ZONES (Z1 TO Z5) */}
          {activeSubTab === 'hr_zones' && activity.heartRateZones && (
            <div className="bg-[#091329] border border-[#17284f] rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
              <div className="pb-3 border-b border-[#142344]">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  Distribuição de Frequência Cardíaca por Zonas
                </h3>
                <p className="text-xs text-slate-400">
                  Modelo fisiológico de 5 zonas com base na sua frequência cardíaca máxima estimada.
                </p>
              </div>

              {/* Combined Stacked Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-4 rounded-xl overflow-hidden flex bg-[#060c19] border border-[#17284f]">
                  {activity.heartRateZones.map((z) => (
                    <div
                      key={z.zone}
                      style={{
                        width: `${z.percent}%`,
                        backgroundColor: z.color,
                      }}
                      title={`${z.name}: ${z.percent}% (${formatDuration(z.timeSeconds)})`}
                      className="h-full transition-all hover:opacity-80"
                    />
                  ))}
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                  <span>Z1 Leve</span>
                  <span>Z2 Aeróbica</span>
                  <span>Z3 Ritmo</span>
                  <span>Z4 Limiar</span>
                  <span>Z5 Pico</span>
                </div>
              </div>

              {/* Zone Cards */}
              <div className="space-y-3">
                {activity.heartRateZones.map((z) => (
                  <div
                    key={z.zone}
                    className="p-4 rounded-2xl bg-[#060c19] border border-[#17284f] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-slate-950 shrink-0"
                        style={{ backgroundColor: z.color }}
                      >
                        Z{z.zone}
                      </div>

                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{z.name}</span>
                          <span className="text-xs font-mono text-slate-400">
                            ({z.minBpm} - {z.maxBpm} bpm)
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{z.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 text-xs shrink-0">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">
                          Tempo na Zona
                        </span>
                        <span className="text-sm font-bold text-white">
                          {formatDuration(z.timeSeconds)}
                        </span>
                      </div>

                      <div className="text-right min-w-[50px]">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">
                          Percentual
                        </span>
                        <span className="text-base font-black text-amber-300">{z.percent}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 4: BEST EFFORTS (MELHORES ESFORÇOS) */}
          {activeSubTab === 'best_efforts' && (
            <div className="bg-[#091329] border border-[#17284f] rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
              <div className="pb-3 border-b border-[#142344]">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Melhores Esforços Registrados nesta Corrida
                </h3>
                <p className="text-xs text-slate-400">
                  Tempos e ritmos mais rápidos alcançados em distâncias padronizadas (janela
                  deslizante).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activity.bestEfforts.map((effort) => (
                  <div
                    key={effort.distanceLabel}
                    className={`p-4 rounded-2xl border transition-all ${
                      effort.achieved
                        ? 'bg-[#060c19] border-amber-500/30 shadow-md'
                        : 'bg-[#040813] border-[#101b33] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {effort.distanceLabel}
                      </span>
                      {effort.achieved ? (
                        <Trophy className="w-4 h-4 text-amber-400" />
                      ) : (
                        <span className="text-[10px] text-slate-600">Não atingido</span>
                      )}
                    </div>

                    <div className="mt-2">
                      <div className="text-2xl font-black text-white tracking-tight">
                        {effort.achieved ? effort.timeFormatted : '--:--'}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Ritmo Médio:{' '}
                        <span className="font-bold text-amber-300">
                          {effort.achieved ? effort.paceFormatted : '--:--'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 5: RAW GPX DATA INSPECTOR */}
          {activeSubTab === 'raw_data' && (
            <div className="bg-[#091329] border border-[#17284f] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#142344]">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Table className="w-5 h-5 text-amber-400" />
                    Inspetor de Dados Brutos do GPX
                  </h3>
                  <p className="text-xs text-slate-400">
                    Todos os {activity.pointsCount} pontos de coordenadas GPS, elevação, carimbo de
                    data/hora e telemetria.
                  </p>
                </div>

                <div className="text-xs text-slate-400">
                  Página {rawPage} de {Math.ceil(activity.points.length / rawPageSize)}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#17284f] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Distância</th>
                      <th className="py-2.5 px-3">Latitude</th>
                      <th className="py-2.5 px-3">Longitude</th>
                      <th className="py-2.5 px-3">Altimetria</th>
                      <th className="py-2.5 px-3">Horário</th>
                      <th className="py-2.5 px-3">Velocidade</th>
                      <th className="py-2.5 px-3">FC</th>
                      <th className="py-2.5 px-3">Cadência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#101b33]">
                    {activity.points
                      .slice((rawPage - 1) * rawPageSize, rawPage * rawPageSize)
                      .map((p) => (
                        <tr
                          key={p.index}
                          className="hover:bg-[#122247]/60 transition-colors text-slate-200"
                        >
                          <td className="py-2 px-3 font-mono text-slate-500">{p.index + 1}</td>
                          <td className="py-2 px-3 font-bold text-white">
                            {(p.distanceFromStartM / 1000).toFixed(3)} km
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-400">{p.lat.toFixed(6)}</td>
                          <td className="py-2 px-3 font-mono text-slate-400">{p.lon.toFixed(6)}</td>
                          <td className="py-2 px-3 font-bold text-amber-300">{p.ele.toFixed(1)}m</td>
                          <td className="py-2 px-3 font-mono text-slate-400">
                            {p.time ? new Date(p.time).toLocaleTimeString('pt-BR') : '-'}
                          </td>
                          <td className="py-2 px-3 font-bold text-emerald-300">{p.speedKmh} km/h</td>
                          <td className="py-2 px-3 text-rose-300 font-bold">
                            {p.heartRate ? `${p.heartRate} bpm` : '-'}
                          </td>
                          <td className="py-2 px-3 text-indigo-300 font-bold">
                            {p.cadence ? `${p.cadence} spm` : '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between pt-3 border-t border-[#142344]">
                <button
                  disabled={rawPage <= 1}
                  onClick={() => setRawPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl bg-[#060c19] border border-[#17284f] text-xs font-bold text-slate-300 disabled:opacity-40 hover:bg-[#122247] cursor-pointer"
                >
                  Anterior
                </button>
                <span className="text-xs text-slate-400">
                  Mostrando {(rawPage - 1) * rawPageSize + 1} -{' '}
                  {Math.min(activity.points.length, rawPage * rawPageSize)} de{' '}
                  {activity.points.length} pontos
                </span>
                <button
                  disabled={rawPage >= Math.ceil(activity.points.length / rawPageSize)}
                  onClick={() => setRawPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl bg-[#060c19] border border-[#17284f] text-xs font-bold text-slate-300 disabled:opacity-40 hover:bg-[#122247] cursor-pointer"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State - Direct Upload Hub */
        <div className="bg-[#091329] border border-[#17284f] rounded-3xl p-8 sm:p-14 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Pronto para Analisar sua Corrida
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Importe o arquivo <code className="text-amber-300 font-mono">.gpx</code> do seu relógio ou celular para ver o mapa interativo com o traçado real, perfil de altimetria, parciais por quilômetro e telemetria.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>Selecionar Arquivo .GPX</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#142344] max-w-md mx-auto text-[11px] text-slate-400">
            Compatível com Garmin, Strava, Apple Watch, Coros, Polar, Suunto e qualquer arquivo GPX com coordenadas GPS.
          </div>
        </div>
      )}

      {/* SAVED RUNS HISTORY SECTION */}
      {savedRuns.length > 0 && (
        <div className="bg-[#091329] border border-[#17284f] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#142344]">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Histórico de Corridas Salvas ({savedRuns.length})
              </h3>
              <p className="text-xs text-slate-400">
                Corridas de rua salvas localmente no seu dispositivo.
              </p>
            </div>

            {/* Volume Stats Summary */}
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">
                Total acumulado:{' '}
                <strong className="text-amber-300 font-bold">
                  {totalVolumeStats.km.toFixed(1)} km
                </strong>
              </span>
              <span className="text-slate-400">
                Tempo:{' '}
                <strong className="text-white font-bold">
                  {formatDuration(totalVolumeStats.timeSec)}
                </strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedRuns.map((run) => {
              const isCurrent = activity?.id === run.id;
              return (
                <div
                  key={run.id}
                  onClick={() => setActivity(run)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                    isCurrent
                      ? 'bg-[#0f1f42] border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'bg-[#060c19] border-[#142344] hover:border-[#1e3870]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white truncate">{run.title}</h4>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">
                            Ativa
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(run.date).toLocaleDateString('pt-BR')} às {run.startTimeFormatted}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSavedRun(run.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all opacity-0 group-hover:opacity-100"
                      title="Excluir corrida salva"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#122247] text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 font-bold block">
                        Distância
                      </span>
                      <span className="font-black text-amber-300">{run.totalDistanceKm}k</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-slate-500 font-bold block">
                        Ritmo
                      </span>
                      <span className="font-bold text-white">{run.movingPaceFormatted}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-slate-500 font-bold block">
                        Tempo
                      </span>
                      <span className="font-bold text-slate-300">
                        {formatDuration(run.movingTimeSeconds)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
