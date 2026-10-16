import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running standalone as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 hover:brightness-110 transition-all cursor-pointer"
        title="Instalar Aliyah no seu dispositivo"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f1d3a] hover:bg-[#162a52] border border-[#a16207]/40 text-amber-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          title="Instalar Aliyah no iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03060f]/85 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-3xl bg-[#0a142c] border border-[#1a2d56] p-6 shadow-2xl text-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-[#17284f] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Instalar no iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-7 h-7 rounded-full bg-[#122247] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 bg-[#060c19] p-3 rounded-xl border border-[#17284f]">
                  <Share2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    1. No Safari, toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima na barra inferior).
                  </span>
                </div>
                <div className="flex items-start gap-3 bg-[#060c19] p-3 rounded-xl border border-[#17284f]">
                  <PlusSquare className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.
                  </span>
                </div>
                <p className="text-xs text-amber-300/80">
                  O Aliyah abrirá em tela cheia como um aplicativo nativo.
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#122247] hover:bg-[#182f61] text-white text-xs font-bold border border-[#1a2d56] transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
