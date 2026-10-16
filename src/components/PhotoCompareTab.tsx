import React, { useState, useRef } from 'react';
import {
  ProgressPhoto,
} from '../types/fitness';
import {
  Camera,
  Upload,
  Split,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

interface PhotoCompareTabProps {
  photos: ProgressPhoto[];
  currentWeight: number;
  onAddPhoto: (photo: Omit<ProgressPhoto, 'id'>) => void;
  onDeletePhoto: (id: string) => void;
}

export const PhotoCompareTab: React.FC<PhotoCompareTabProps> = ({
  photos,
  currentWeight,
  onAddPhoto,
  onDeletePhoto,
}) => {
  // Split Slider state (percentage from 0 to 100)
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected comparison pair
  const [beforePhotoId, setBeforePhotoId] = useState<string>(photos[0]?.id || '');
  const [afterPhotoId, setAfterPhotoId] = useState<string>(photos[1]?.id || photos[0]?.id || '');

  // Add Photo Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('Evolução do Mês');
  const [newPose, setNewPose] = useState<'front' | 'side' | 'back'>('front');
  const [newWeight, setNewWeight] = useState<number>(currentWeight);
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newImgData, setNewImgData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const beforePhoto = photos.find((p) => p.id === beforePhotoId) || photos[0];
  const afterPhoto = photos.find((p) => p.id === afterPhotoId) || photos[photos.length - 1];

  // Drag handlers for split slider
  const handleTouchOrMouseMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleTouchOrMouseMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleTouchOrMouseMove(e.touches[0].clientX);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewImgData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNewPhoto = () => {
    if (!newImgData) return;
    onAddPhoto({
      title: newTitle || 'Registro de Evolução',
      pose: newPose,
      weightAtTime: Number(newWeight) || currentWeight,
      date: newDate,
      imageUrl: newImgData,
      notes: `Pesagem de ${newWeight}kg`,
    });

    setNewImgData(null);
    setIsAddModalOpen(false);
  };

  const weightDelta =
    beforePhoto && afterPhoto
      ? Number((afterPhoto.weightAtTime - beforePhoto.weightAtTime).toFixed(1))
      : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0a142c] via-[#0d1a38] to-[#12244f] border border-[#1a2d56] rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Split className="w-4 h-4 text-amber-400" /> Comparador Interativo de Transformação Corporal
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
            Arraste o cursor para comparar o Antes e Depois
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Acompanhe visualmente a queima de gordura e o ganho de definição muscular lado a lado com precisão milimétrica.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all shrink-0"
        >
          <Camera className="w-4 h-4" /> Adicionar Foto
        </button>
      </div>

      {/* INTERACTIVE SPLIT SLIDER CONTAINER */}
      {beforePhoto && afterPhoto ? (
        <div className="bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-2xl space-y-4">
          {/* Selectors for Photo A and Photo B */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#060c19] p-3 rounded-2xl border border-[#17284f]">
            <div>
              <label className="block text-[11px] font-bold text-rose-400 uppercase mb-1">
                Foto "Antes" (Esquerda)
              </label>
              <select
                value={beforePhotoId}
                onChange={(e) => setBeforePhotoId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a142c] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
              >
                {photos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} - {p.weightAtTime}kg ({new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">
                Foto "Depois" (Direita)
              </label>
              <select
                value={afterPhotoId}
                onChange={(e) => setAfterPhotoId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a142c] border border-[#1a2d56] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
              >
                {photos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} - {p.weightAtTime}kg ({new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Viewer */}
          <div
            ref={containerRef}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={(e) => {
              if (e.touches[0]) handleTouchOrMouseMove(e.touches[0].clientX);
            }}
            onTouchMove={handleTouchMove}
            className="relative w-full max-w-2xl mx-auto aspect-[3/4] sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#1c305c] select-none cursor-ew-resize bg-black"
          >
            {/* Background image: "Depois" (revealed on right side) */}
            <img
              src={afterPhoto.imageUrl}
              alt="Depois"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            />

            {/* Foreground image: "Antes" (clipped to sliderPos percentage) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={beforePhoto.imageUrl}
                alt="Antes"
                className="absolute inset-0 w-full h-full object-cover object-center max-w-none"
                style={{ width: containerRef.current?.offsetWidth || '100%' }}
              />
            </div>

            {/* Vertical divider line & handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)] pointer-events-none z-20 flex items-center justify-center"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-10 h-10 rounded-full bg-[#0a142c] border-2 border-amber-400 text-amber-400 flex items-center justify-center shadow-2xl">
                <Split className="w-5 h-5 text-amber-400 rotate-90" />
              </div>
            </div>

            {/* Floating Info Badges */}
            <div className="absolute top-4 left-4 z-20 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-rose-500/30 text-xs">
              <span className="font-extrabold text-rose-400 uppercase tracking-wide">Antes: </span>
              <span className="text-white font-mono font-bold">{beforePhoto.weightAtTime} kg</span>
              <span className="text-slate-400 text-[10px] block">
                {new Date(beforePhoto.date + 'T12:00:00').toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="absolute top-4 right-4 z-20 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs text-right">
              <span className="font-extrabold text-amber-400 uppercase tracking-wide">Depois: </span>
              <span className="text-white font-mono font-bold">{afterPhoto.weightAtTime} kg</span>
              <span className="text-slate-400 text-[10px] block">
                {new Date(afterPhoto.date + 'T12:00:00').toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Center Bottom Result */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#1a2d56] text-center">
              <span className="text-[11px] text-slate-300">Variação no Período:</span>
              <span
                className={`ml-1.5 text-xs font-mono font-black ${
                  weightDelta <= 0 ? 'text-amber-400' : 'text-amber-500'
                }`}
              >
                {weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400">
            Dica: arraste a linha vertical para a esquerda ou direita para comparar
          </p>
        </div>
      ) : (
        <div className="text-center py-12 bg-[#0a142c] border border-dashed border-[#1a2d56] rounded-3xl text-slate-400 text-xs">
          Adicione ao menos 2 fotos de evolução para ativar a ferramenta interativa de comparação.
        </div>
      )}

      {/* GALLERY GRID */}
      <div>
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
          Galeria de Fotos Salvas ({photos.length})
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((p) => (
            <div
              key={p.id}
              className="bg-[#0a142c] border border-[#1a2d56] hover:border-amber-400/40 rounded-2xl overflow-hidden shadow-sm group transition-all"
            >
              <div className="aspect-[3/4] relative bg-black">
                <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => onDeletePhoto(p.id)}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-rose-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Excluir foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[10px] text-white font-mono font-bold">
                  {p.weightAtTime} kg
                </div>
              </div>

              <div className="p-3">
                <div className="font-semibold text-xs text-white truncate">{p.title}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    onClick={() => setBeforePhotoId(p.id)}
                    className="flex-1 py-1 rounded bg-[#122247] hover:bg-rose-500/20 text-rose-300 text-[10px] font-bold transition-colors"
                  >
                    Usar Antes
                  </button>
                  <button
                    onClick={() => setAfterPhotoId(p.id)}
                    className="flex-1 py-1 rounded bg-[#122247] hover:bg-amber-500/20 text-amber-300 text-[10px] font-bold transition-colors"
                  >
                    Usar Depois
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: ADD PHOTO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060f]/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#17284f] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                Nova Foto de Evolução
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {newImgData ? (
              <div className="relative aspect-[3/4] max-h-56 mx-auto rounded-2xl overflow-hidden border border-[#1a2d56] bg-black">
                <img src={newImgData} alt="Nova" className="w-full h-full object-contain" />
                <button
                  onClick={() => setNewImgData(null)}
                  className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#17284f] hover:border-amber-400 p-8 rounded-2xl text-center cursor-pointer bg-[#060c19]"
              >
                <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <span className="text-xs font-semibold text-white block">
                  Clique para carregar foto da galeria ou tirar pela câmera
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Peso naquele dia (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pose</label>
                <select
                  value={newPose}
                  onChange={(e) => setNewPose(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="front">Frente</option>
                  <option value="side">Lado / Perfil</option>
                  <option value="back">Costas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Data</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              onClick={handleSaveNewPhoto}
              disabled={!newImgData}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all"
            >
              <Check className="w-4 h-4" /> Salvar Foto de Evolução
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
