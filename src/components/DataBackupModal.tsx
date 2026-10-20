import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  FileCheck,
  AlertCircle,
  X,
  Check,
  Dumbbell,
  Scale,
  Utensils,
  CheckSquare,
  Sparkles,
  Activity,
} from 'lucide-react';
import { exportAppData, importAppData, getCurrentDataCounts, BackupCounts, AliyahBackupPayload } from '../utils/backup';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: (data: AliyahBackupPayload['data']) => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [counts, setCounts] = useState<BackupCounts>(getCurrentDataCounts());
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
    counts?: BackupCounts;
  }>({ type: 'idle', message: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const { filename } = exportAppData();
      setExportFeedback(`Arquivo "${filename}" baixado com sucesso!`);
      setTimeout(() => setExportFeedback(null), 5000);
    } catch {
      setExportFeedback('Erro ao gerar download do backup.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const result = importAppData(content);
      if (result.success && result.data) {
        setImportStatus({
          type: 'success',
          message: 'Seus dados foram restaurados com sucesso!',
          counts: result.counts,
        });
        setCounts(getCurrentDataCounts());
        onDataRestored(result.data);
      } else {
        setImportStatus({
          type: 'error',
          message: result.message || 'Falha ao importar o arquivo.',
        });
      }
    };

    reader.onerror = () => {
      setImportStatus({
        type: 'error',
        message: 'Não foi possível ler o arquivo selecionado.',
      });
    };

    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060f]/85 backdrop-blur-md overflow-y-auto safe-area-top safe-area-bottom">
      <div className="relative w-full max-w-xl bg-[#0a142c] border border-[#1a2d56] rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#17284f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Exportar & Importar Dados
              </h3>
              <p className="text-xs text-slate-300">
                Faça backup de todos os seus treinos, cargas, refeições e metas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#122247] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Summary of current data */}
          <div className="bg-[#060c19] rounded-2xl p-4 border border-[#17284f] space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Seus Dados Gravados Atualmente
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="bg-[#0a142c] p-2.5 rounded-xl border border-[#17284f] text-center">
                <Dumbbell className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-base font-bold text-white font-mono">{counts.workoutLogs}</div>
                <div className="text-[11px] text-slate-400">Treinos Salvos</div>
              </div>
              <div className="bg-[#0a142c] p-2.5 rounded-xl border border-[#17284f] text-center">
                <FileCheck className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <div className="text-base font-bold text-white font-mono">{counts.workoutTemplates}</div>
                <div className="text-[11px] text-slate-400">Fichas Criadas</div>
              </div>
              <div className="bg-[#0a142c] p-2.5 rounded-xl border border-[#17284f] text-center">
                <Activity className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-base font-bold text-white font-mono">{counts.runs}</div>
                <div className="text-[11px] text-slate-400">Corridas GPX</div>
              </div>
              <div className="bg-[#0a142c] p-2.5 rounded-xl border border-[#17284f] text-center">
                <Scale className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-base font-bold text-white font-mono">{counts.weightLogs}</div>
                <div className="text-[11px] text-slate-400">Pesagens</div>
              </div>
              <div className="bg-[#0a142c] p-2.5 rounded-xl border border-[#17284f] text-center">
                <Utensils className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                <div className="text-base font-bold text-white font-mono">{counts.foodLogs}</div>
                <div className="text-[11px] text-slate-400">Refeições</div>
              </div>
            </div>
          </div>

          {/* Section 1: Export */}
          <div className="bg-gradient-to-br from-[#0a142c] to-[#0d1c3a] border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">1. Exportar Meus Dados (Download)</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gera um arquivo de segurança no formato <code>.json</code> contendo todo o seu histórico: perfil, treinos, pesos, histórico de cargas, hábitos e metas. Você pode guardar no celular ou computador.
            </p>
            <button
              onClick={handleExport}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Baixar Arquivo de Backup (.json)
            </button>
            {exportFeedback && (
              <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                <Check className="w-3.5 h-3.5" /> {exportFeedback}
              </div>
            )}
          </div>

          {/* Section 2: Import */}
          <div className="bg-[#060c19] border border-[#17284f] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-300" />
              <h4 className="text-sm font-bold text-white">2. Importar Dados (Restaurar Backup)</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Se você trocou de aparelho ou deseja restaurar um backup salvo anteriormente, selecione o arquivo <code>.json</code> abaixo. Os dados serão restaurados imediatamente.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
              id="aliyah-backup-file-input"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#122247] hover:bg-[#192f61] border border-amber-500/30 text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-400" /> Escolher Arquivo de Backup (.json)
            </button>

            {importStatus.type === 'success' && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1">
                <div className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> {importStatus.message}
                </div>
                {importStatus.counts && (
                  <div className="text-[11px] text-slate-300">
                    Restaurado: {importStatus.counts.workoutLogs} treinos, {importStatus.counts.workoutTemplates} fichas, {importStatus.counts.weightLogs} pesagens e {importStatus.counts.foodLogs} refeições.
                  </div>
                )}
              </div>
            )}

            {importStatus.type === 'error' && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#17284f] bg-[#060c19] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#122247] hover:bg-[#182f61] text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
