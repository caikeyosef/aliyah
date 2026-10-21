import React, { useState, useEffect, useRef } from 'react';
import { FeedPost } from '../types/feed';
import {
  renderStoryToCanvas,
  StoryBackgroundStyle,
  StoryRenderOptions,
} from '../utils/storyCanvasGenerator';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Camera,
  Flame,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Layers,
  Activity,
  Dumbbell,
} from 'lucide-react';

interface StoryShareModalProps {
  post: FeedPost | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StoryShareModal: React.FC<StoryShareModalProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  const [backgroundStyle, setBackgroundStyle] = useState<StoryBackgroundStyle>('dark');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [showRouteMap, setShowRouteMap] = useState(true);
  const [showExercises, setShowExercises] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Trigger render when options or post change
  useEffect(() => {
    if (!isOpen || !post) return;

    let isMounted = true;
    setIsGenerating(true);

    const canvas = canvasRef.current || document.createElement('canvas');

    const options: StoryRenderOptions = {
      backgroundStyle,
      customPhotoUrl: customPhotoUrl || undefined,
      showRouteMap,
      showExercises,
      accentColor: post.type === 'running_gpx' ? '#f97316' : '#f59e0b',
    };

    renderStoryToCanvas(canvas, post, options)
      .then(() => {
        if (!isMounted) return;
        try {
          const dataUrl = canvas.toDataURL('image/png');
          setPreviewUrl(dataUrl);
        } catch (e) {
          console.error('Erro ao gerar preview do story', e);
        }
      })
      .finally(() => {
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, post, backgroundStyle, customPhotoUrl, showRouteMap, showExercises]);

  if (!isOpen || !post) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Convert canvas to Blob
  const getCanvasBlob = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  // 1. Share directly to Instagram Stories
  const handleShareToInstagram = async () => {
    try {
      const blob = await getCanvasBlob();
      if (!blob) return;

      const file = new File([blob], `aliyah-${post.type}-${Date.now()}.png`, {
        type: 'image/png',
      });

      // Also copy to clipboard for seamless pasting inside Instagram Story sticker
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
        }
      } catch (clipErr) {
        // Clipboard write can fail on some mobile browsers without direct user gesture; ignore
      }

      // Check if Web Share API with files is supported (iOS Safari / Android Chrome)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: post.title,
          text: `Treino concluído no Aliyah! 🔥 #Aliyah #Fitness #Treino`,
        });
        showToast('Compartilhando diretamente no Instagram Stories!');
        return;
      }

      // Fallback: On Mobile, open Instagram app scheme + trigger download
      downloadImage();
      showToast('Imagem salva! Abrindo o Instagram Stories...');

      // Try opening Instagram Stories camera
      setTimeout(() => {
        window.location.href = 'instagram-stories://share';
        setTimeout(() => {
          window.location.href = 'instagram://story-camera';
        }, 600);
      }, 500);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        downloadImage();
        showToast('Imagem baixada! Abra o Instagram e selecione na sua galeria.');
      }
    }
  };

  // 2. Download Image
  const downloadImage = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `aliyah-story-${post.date || 'atleta'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Imagem do Story (1080×1920) baixada com sucesso!');
  };

  // 3. Copy image to clipboard
  const handleCopyImage = async () => {
    try {
      const blob = await getCanvasBlob();
      if (!blob) return;

      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopySuccess(true);
        showToast('Imagem copiada para a área de transferência! Cole direto no Story.');
        setTimeout(() => setCopySuccess(false), 2500);
      } else {
        downloadImage();
      }
    } catch (e) {
      downloadImage();
    }
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCustomPhotoUrl(ev.target.result as string);
        setBackgroundStyle('photo');
      }
    };
    reader.readAsDataURL(file);
  };

  const isRunning = post.type === 'running_gpx';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060f]/90 backdrop-blur-md safe-area-top safe-area-bottom overflow-y-auto">
      {/* Hidden high-res rendering canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Floating Notice Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-2xl bg-[#091530] border border-amber-500/50 text-amber-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-4xl bg-[#091228] border border-[#182c57] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#14264f] bg-[#060c1c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#bc1888] to-[#cc2366] flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm sm:text-base text-white tracking-tight">
                Compartilhar no Instagram Stories
              </h3>
              <p className="text-[11px] text-slate-400">
                Design esportivo de alta resolução 1080×1920 (Estilo Hevy & Strava)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#0f1d3d] hover:bg-[#152750] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left 9:16 Preview, Right Controls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* LEFT: 9:16 LIVE STORY PHONE PREVIEW */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[270px] aspect-[9/16] rounded-[36px] p-2.5 bg-[#03060f] border-4 border-[#1c305c] shadow-2xl overflow-hidden group">
              {/* Phone Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#03060f] rounded-full z-20 pointer-events-none" />

              {/* Story Canvas Preview Image */}
              <div className="w-full h-full rounded-[28px] overflow-hidden bg-black flex items-center justify-center relative">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-2 text-xs text-amber-400">
                    <Sparkles className="w-6 h-6 animate-spin" />
                    <span>Gerando Story...</span>
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Story Preview"
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>

              {/* Live Badge */}
              <div className="absolute bottom-4 right-4 z-20">
                <span className="px-2 py-0.5 rounded-full bg-black/60 text-[9px] font-bold text-slate-300 backdrop-blur-md">
                  1080 × 1920
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Pré-visualização em tempo real do Story
            </p>
          </div>

          {/* RIGHT: CUSTOMIZATION OPTIONS & INSTAGRAM ACTIONS */}
          <div className="md:col-span-7 space-y-5">
            {/* BACKGROUND PICKER (HEVY STYLE) */}
            <div className="space-y-2.5 bg-[#060c1a] p-4 rounded-2xl border border-[#132349]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Estilo de Fundo (Background)
                </span>
                {customPhotoUrl && (
                  <button
                    onClick={() => {
                      setCustomPhotoUrl(null);
                      setBackgroundStyle('dark');
                    }}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Remover Foto
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {/* 1. Dark Obsidian */}
                <button
                  type="button"
                  onClick={() => setBackgroundStyle('dark')}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    backgroundStyle === 'dark'
                      ? 'bg-[#0f1f44] border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-[#040813] border-[#16274e] hover:border-slate-500'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#040814] to-[#070f26] border border-slate-700 shadow-inner" />
                  <span className="text-[10px] font-bold text-slate-300">Obsidian</span>
                </button>

                {/* 2. Matte Black (Strava) */}
                <button
                  type="button"
                  onClick={() => setBackgroundStyle('matte')}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    backgroundStyle === 'matte'
                      ? 'bg-[#0f1f44] border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-[#040813] border-[#16274e] hover:border-slate-500'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0e1014] border border-slate-800 shadow-inner" />
                  <span className="text-[10px] font-bold text-slate-300">Matte Strava</span>
                </button>

                {/* 3. Sunset Amber */}
                <button
                  type="button"
                  onClick={() => setBackgroundStyle('amber')}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    backgroundStyle === 'amber'
                      ? 'bg-[#0f1f44] border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-[#040813] border-[#16274e] hover:border-slate-500'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#150a04] via-[#ea580c] to-[#f59e0b] border border-amber-600/40 shadow-inner" />
                  <span className="text-[10px] font-bold text-slate-300">Sunset</span>
                </button>

                {/* 4. Transparent Sticker */}
                <button
                  type="button"
                  onClick={() => setBackgroundStyle('transparent')}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    backgroundStyle === 'transparent'
                      ? 'bg-[#0f1f44] border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-[#040813] border-[#16274e] hover:border-slate-500'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[repeating-conic-gradient(#334155_0_25%,#1e293b_0_50%)] [background-size:8px_8px] border border-slate-600 shadow-inner" />
                  <span className="text-[10px] font-bold text-slate-300">Sticker</span>
                </button>

                {/* 5. Custom User Photo (Camera / Gallery) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    backgroundStyle === 'photo'
                      ? 'bg-[#0f1f44] border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-[#040813] border-[#16274e] hover:border-slate-500'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0e1c3b] flex items-center justify-center text-amber-400 border border-amber-500/40">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 truncate w-full">Sua Foto</span>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* TOGGLES FOR ELEMENTS */}
            <div className="bg-[#060c1a] p-4 rounded-2xl border border-[#132349] space-y-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Elementos do Story
              </span>

              <div className="flex flex-wrap gap-3">
                {isRunning && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRouteMap}
                      onChange={(e) => setShowRouteMap(e.target.checked)}
                      className="rounded accent-amber-500 w-4 h-4"
                    />
                    <span>Traçado GPS Neon (Strava Map)</span>
                  </label>
                )}

                {post.type === 'workout' && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showExercises}
                      onChange={(e) => setShowExercises(e.target.checked)}
                      className="rounded accent-amber-500 w-4 h-4"
                    />
                    <span>Lista de Exercícios & Cargas</span>
                  </label>
                )}
              </div>
            </div>

            {/* MAIN ACTION: POST TO INSTAGRAM STORIES */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleShareToInstagram}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] hover:brightness-110 text-white font-heading font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-pink-500/25 transition-all cursor-pointer transform active:scale-[0.98]"
              >
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <span>Publicar no Instagram Stories</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Download Image button */}
                <button
                  onClick={downloadImage}
                  className="py-3 px-4 rounded-xl bg-[#091530] hover:bg-[#11234a] border border-[#182c57] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Baixar Imagem</span>
                </button>

                {/* Copy Image to Clipboard button */}
                <button
                  onClick={handleCopyImage}
                  className="py-3 px-4 rounded-xl bg-[#091530] hover:bg-[#11234a] border border-[#182c57] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copySuccess ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-amber-400" />
                  )}
                  <span>{copySuccess ? 'Copiado!' : 'Copiar Imagem'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
                Ao clicar em <strong>Publicar</strong> no celular, o app abre automaticamente o Instagram com o arquivo pronto para publicar nos seus Stories.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
