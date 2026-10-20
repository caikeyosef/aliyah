import React, { useState } from 'react';
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  LineChart,
  Split,
  User,
  Sparkles,
  Droplet,
  RotateCcw,
  CheckSquare,
  Calculator,
  Menu,
  X,
  Database,
  Activity,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type TabType =
  | 'dashboard'
  | 'workouts'
  | 'running'
  | 'nutrition'
  | 'hydration'
  | 'habits'
  | 'charts'
  | 'photos'
  | 'profile';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenFoodCalculator: () => void;
  onOpenResetConfirm?: () => void;
  onOpenBackupModal?: () => void;
  targetDays?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenFoodCalculator,
  onOpenResetConfirm,
  onOpenBackupModal,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs: Array<{ id: TabType; label: string; shortLabel: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Painel', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'workouts', label: 'Treinos', shortLabel: 'Treinos', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'running', label: 'Corrida de Rua', shortLabel: 'Corrida', icon: <Activity className="w-4 h-4" /> },
    { id: 'nutrition', label: 'Nutrição', shortLabel: 'Nutrição', icon: <Utensils className="w-4 h-4" /> },
    { id: 'hydration', label: 'Hidratação', shortLabel: 'Água', icon: <Droplet className="w-4 h-4" /> },
    { id: 'habits', label: 'Hábitos', shortLabel: 'Hábitos', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'charts', label: 'Evolução', shortLabel: 'Evolução', icon: <LineChart className="w-4 h-4" /> },
    { id: 'photos', label: 'Antes & Depois', shortLabel: 'Fotos', icon: <Split className="w-4 h-4" /> },
    { id: 'profile', label: 'Perfil & Metas', shortLabel: 'Perfil', icon: <User className="w-4 h-4" /> },
  ];

  const handleSelectTab = (tabId: TabType) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#050a18]/95 backdrop-blur-xl border-b border-[#142344] shadow-2xl safe-area-top">
        {/* ROW 1: Brand Identity & Quick Utilities (Full width, spacious, never crowded) */}
        <div className="border-b border-[#121f3d]/70 bg-gradient-to-r from-[#040813] via-[#071126] to-[#040813]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-4">
            {/* Left Brand Identity */}
            <div
              onClick={() => handleSelectTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
              title="Aliyah - Evolução, Ascensão e Transformação"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/25 group-hover:scale-105 transition-all shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-xl sm:text-2xl tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent group-hover:brightness-110 transition-all">
                  Aliyah
                </span>
                <span
                  className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent font-serif"
                  dir="rtl"
                  lang="he"
                >
                  עלייה
                </span>

                <div className="hidden sm:flex items-center pl-3 ml-2 border-l border-[#1a2d56]">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                    EVOLUÇÃO • BEM-ESTAR
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Utilities */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <PWAInstallButton />

              <button
                onClick={onOpenFoodCalculator}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0e1d3c] hover:bg-[#162c5b] border border-amber-500/30 text-amber-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Tabela e Calculadora Nutricional"
              >
                <Calculator className="w-4 h-4 text-amber-400" />
                <span>Calculadora</span>
              </button>

              {onOpenBackupModal && (
                <button
                  onClick={onOpenBackupModal}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#091329] hover:bg-[#122247] border border-[#1a2d56] text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  title="Exportar ou Importar Dados (Backup)"
                >
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  <span>Backup</span>
                </button>
              )}

              {onOpenResetConfirm && (
                <button
                  onClick={onOpenResetConfirm}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                  title="Zerar todos os dados e voltar para a tela inicial"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Zerar</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-[#0e1b36] border border-[#1a2d56] text-slate-200 hover:text-white focus:outline-none"
                aria-label="Menu de seções"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5 text-amber-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: Desktop Navigation Bar (Dedicated, centered, spacious - NEVER overlaps) */}
        <div className="hidden lg:flex items-center justify-center py-2 px-4 sm:px-6 lg:px-8 bg-[#060c1a]/90">
          <nav className="flex items-center gap-1.5 xl:gap-2 bg-[#091329] p-1.5 rounded-2xl border border-[#17284f] shadow-inner max-w-full">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`group flex items-center gap-2 px-3.5 xl:px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-[#122247]'
                  }`}
                >
                  <span className={isActive ? 'text-slate-950' : 'text-amber-400 group-hover:text-amber-300 transition-colors'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile / Tablet 3x3 Navigation Grid */}
        <div className="grid lg:hidden grid-cols-3 gap-1.5 py-2 px-3 border-t border-[#0d1833]">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`group flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#091329] text-slate-300 hover:text-white hover:bg-[#122247] border border-[#17284f]/60'
                }`}
              >
                <span className={`scale-95 mb-0.5 ${isActive ? 'text-slate-950' : 'text-amber-400 group-hover:text-amber-300 transition-colors'}`}>
                  {tab.icon}
                </span>
                <span className="truncate max-w-full leading-tight">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Mobile Modal Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-[#03060f]/80 backdrop-blur-sm flex flex-col justify-end p-3 animate-in fade-in duration-200 safe-area-top safe-area-bottom">
          <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#17284f]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm text-white">Todas as Seções do Aliyah</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-[#122247] text-slate-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`group flex items-center gap-2.5 p-3 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md'
                        : 'bg-[#060c19] text-slate-200 hover:bg-[#122247] border border-[#17284f]'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400 group-hover:text-amber-300 transition-colors'}`}>
                      {tab.icon}
                    </span>
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#17284f] flex flex-col gap-2">
              {onOpenBackupModal && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenBackupModal();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#091329] border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Exportar & Importar Dados (Backup)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenFoodCalculator();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#122247] border border-amber-500/30 text-amber-200 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4 text-amber-400" />
                <span>Tabela & Calculadora Nutricional</span>
              </button>

              {onOpenResetConfirm && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenResetConfirm();
                  }}
                  className="w-full py-2 px-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Zerar Dados e Recomeçar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FIXED MOBILE BOTTOM DOCK */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050a18]/95 backdrop-blur-xl border-t border-[#142344] px-2 py-2 flex items-center justify-around shadow-2xl safe-area-bottom">
        <button
          onClick={() => handleSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-amber-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Painel</span>
        </button>

        <button
          onClick={() => handleSelectTab('workouts')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'workouts'
              ? 'text-amber-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dumbbell className="w-5 h-5 mb-0.5" />
          <span>Treinos</span>
        </button>

        <button
          onClick={() => handleSelectTab('nutrition')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'nutrition'
              ? 'text-amber-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Utensils className="w-5 h-5 mb-0.5" />
          <span>Nutrição</span>
        </button>

        <button
          onClick={() => handleSelectTab('hydration')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'hydration'
              ? 'text-amber-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Droplet className="w-5 h-5 mb-0.5 text-amber-300" />
          <span>Água</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            ['habits', 'charts', 'photos', 'profile'].includes(activeTab)
              ? 'text-amber-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Mais</span>
        </button>
      </nav>
    </>
  );
};
