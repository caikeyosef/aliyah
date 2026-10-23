import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Camera,
  FileText,
  Database,
  PenTool,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  Flame,
  ArrowRight,
  Upload,
  RefreshCw,
  Calculator,
} from 'lucide-react';
import { MealType, FoodLogItem } from '../types/fitness';
import {
  FoodDatabaseItem,
  OFFLINE_FOOD_DATABASE,
  calculatePortionNutrition,
  parseMealTextMathematically,
  searchOfflineFoods,
} from '../utils/offlineNutritionMath';

export type FoodModalTab = 'camera' | 'text' | 'database' | 'manual';

interface UnifiedFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (item: Omit<FoodLogItem, 'id' | 'createdAt'>) => void;
  defaultMealType?: MealType;
  initialTab?: FoodModalTab;
}

interface AnalyzedItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const CATEGORIES: Array<{ key: string; label: string; icon: string }> = [
  { key: 'all', label: 'Todos', icon: '🍽️' },
  { key: 'proteina', label: 'Proteínas', icon: '🥩' },
  { key: 'carboidrato', label: 'Carbos & Grãos', icon: '🍚' },
  { key: 'fruta', label: 'Frutas', icon: '🍌' },
  { key: 'vegetal', label: 'Vegetais & Saladas', icon: '🥦' },
  { key: 'laticinio', label: 'Laticínios', icon: '🧀' },
  { key: 'gordura', label: 'Gorduras Boas', icon: '🥑' },
  { key: 'suplemento', label: 'Suplementos', icon: '⚡' },
  { key: 'refeicao', label: 'Pratos & PF', icon: '🍛' },
  { key: 'lanche_bebida', label: 'Lanches & Bebidas', icon: '☕' },
];

const MEAL_OPTIONS: Array<{ type: MealType; label: string; icon: string }> = [
  { type: 'breakfast', label: 'Café da Manhã', icon: '🍳' },
  { type: 'lunch', label: 'Almoço', icon: '🍛' },
  { type: 'afternoon_snack', label: 'Lanche da Tarde', icon: '🍌' },
  { type: 'dinner', label: 'Jantar', icon: '🍲' },
  { type: 'snacks', label: 'Ceia & Lanches', icon: '🥛' },
];

const QUICK_TEXT_EXAMPLES = [
  '2 ovos mexidos e 2 fatias de pão integral',
  '150g frango grelhado, 100g arroz branco e 1 concha feijão',
  '1 scoop de whey protein com 1 banana e 30g de aveia',
  '1 prato feito com bife acebolado, arroz, feijão e salada',
  'Crepioca fit com queijo minas e 1 xícara de café preto',
];

export const UnifiedFoodModal: React.FC<UnifiedFoodModalProps> = ({
  isOpen,
  onClose,
  onAddFood,
  defaultMealType = 'lunch',
  initialTab = 'database',
}) => {
  const [activeTab, setActiveTab] = useState<FoodModalTab>(initialTab);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(defaultMealType);

  // ----------------------------------------------------
  // TAB 1: FOTO COM IA STATE
  // ----------------------------------------------------
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPrompt, setPhotoPrompt] = useState<string>('');
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [detectedPhotoItems, setDetectedPhotoItems] = useState<AnalyzedItem[]>([]);
  const [photoMealName, setPhotoMealName] = useState<string>('');
  const [photoHealthTip, setPhotoHealthTip] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ----------------------------------------------------
  // TAB 2: TEXTO COM IA & OFFLINE STATE
  // ----------------------------------------------------
  const [textDescription, setTextDescription] = useState<string>('');
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [parsedTextItems, setParsedTextItems] = useState<AnalyzedItem[]>([]);
  const [textMealName, setTextMealName] = useState<string>('');
  const [textHealthTip, setTextHealthTip] = useState<string>('');

  // ----------------------------------------------------
  // TAB 3: BANCO DE ALIMENTOS STATE
  // ----------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodDatabaseItem | null>(null);
  const [portionGrams, setPortionGrams] = useState<number>(100);

  // ----------------------------------------------------
  // TAB 4: MANUAL OFFLINE STATE
  // ----------------------------------------------------
  const [manualName, setManualName] = useState('');
  const [manualPortion, setManualPortion] = useState('1 porção');
  const [manualCalories, setManualCalories] = useState<number>(0);
  const [manualProtein, setManualProtein] = useState<number>(0);
  const [manualCarbs, setManualCarbs] = useState<number>(0);
  const [manualFat, setManualFat] = useState<number>(0);

  // Reset or initialize when opened
  React.useEffect(() => {
    if (isOpen) {
      setSelectedMealType(defaultMealType);
      if (initialTab) setActiveTab(initialTab);
    }
  }, [isOpen, defaultMealType, initialTab]);

  // Filtered offline database foods
  const filteredFoods = useMemo(() => {
    return searchOfflineFoods(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  // Nutrition calculation for selected offline database item
  const selectedFoodNutrition = useMemo(() => {
    if (!selectedFoodItem) return null;
    return calculatePortionNutrition(selectedFoodItem, portionGrams);
  }, [selectedFoodItem, portionGrams]);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // HANDLERS FOR PHOTO TAB
  // ----------------------------------------------------
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setPhotoError('A imagem deve ter no máximo 15MB.');
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzePhoto = async () => {
    if (!photoBase64) return;
    setIsAnalyzingPhoto(true);
    setPhotoError(null);

    try {
      const response = await fetch('/api/analyze-food-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photoBase64,
          prompt: photoPrompt,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Não foi possível analisar a imagem');
      }

      const data = json.data;
      setPhotoMealName(data.name || 'Refeição identificada');
      setPhotoHealthTip(data.healthTip || '');

      if (Array.isArray(data.items) && data.items.length > 0) {
        setDetectedPhotoItems(
          data.items.map((item: any, idx: number) => ({
            id: `photo_item_${Date.now()}_${idx}`,
            name: item.name || 'Alimento',
            portion: item.portion || '100g',
            calories: Math.round(Number(item.calories) || 0),
            protein: Number((Number(item.protein) || 0).toFixed(1)),
            carbs: Number((Number(item.carbs) || 0).toFixed(1)),
            fat: Number((Number(item.fat) || 0).toFixed(1)),
          }))
        );
      } else {
        setDetectedPhotoItems([
          {
            id: `photo_item_${Date.now()}_0`,
            name: data.name || 'Prato identificado',
            portion: data.portion || '1 porção',
            calories: Math.round(Number(data.calories) || 350),
            protein: Number((Number(data.protein) || 25).toFixed(1)),
            carbs: Number((Number(data.carbs) || 35).toFixed(1)),
            fat: Number((Number(data.fat) || 10).toFixed(1)),
          },
        ]);
      }
    } catch (err: any) {
      console.warn('AI photo analysis failed, falling back:', err);
      setPhotoError(
        'A análise por IA online oscilou. Você pode descrever o prato ao lado ou adicionar pelo banco de dados!'
      );
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // ----------------------------------------------------
  // HANDLERS FOR TEXT TAB
  // ----------------------------------------------------
  const handleAnalyzeText = async (textToUse?: string) => {
    const prompt = (textToUse !== undefined ? textToUse : textDescription).trim();
    if (!prompt) return;

    setIsAnalyzingText(true);
    setTextError(null);

    try {
      // First attempt: Server API with Gemini
      const response = await fetch('/api/analyze-food-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt }),
      });

      const json = await response.json();

      if (response.ok && json.success && json.data) {
        const data = json.data;
        setTextMealName(data.name || 'Refeição descrita');
        setTextHealthTip(data.healthTip || '');

        if (Array.isArray(data.items) && data.items.length > 0) {
          setParsedTextItems(
            data.items.map((item: any, idx: number) => ({
              id: `text_item_${Date.now()}_${idx}`,
              name: item.name || 'Item',
              portion: item.portion || '1 porção',
              calories: Math.round(Number(item.calories) || 0),
              protein: Number((Number(item.protein) || 0).toFixed(1)),
              carbs: Number((Number(item.carbs) || 0).toFixed(1)),
              fat: Number((Number(item.fat) || 0).toFixed(1)),
            }))
          );
        } else {
          setParsedTextItems([
            {
              id: `text_item_${Date.now()}_0`,
              name: data.name || 'Refeição',
              portion: data.portion || '1 porção',
              calories: Math.round(Number(data.calories) || 300),
              protein: Number((Number(data.protein) || 20).toFixed(1)),
              carbs: Number((Number(data.carbs) || 30).toFixed(1)),
              fat: Number((Number(data.fat) || 8).toFixed(1)),
            },
          ]);
        }
        return;
      }
      throw new Error('API indisponível, usando motor matemático');
    } catch (err: any) {
      console.warn('Text AI error, applying 100% offline mathematical parser:', err);
      // Seamless deterministic mathematical fallback
      const offlineResult = parseMealTextMathematically(prompt);
      setTextMealName(offlineResult.foodName);
      setTextHealthTip(offlineResult.healthTip);
      setParsedTextItems(
        offlineResult.items.map((item, idx) => ({
          id: `math_item_${Date.now()}_${idx}`,
          name: item.name,
          portion: item.portion,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        }))
      );
    } finally {
      setIsAnalyzingText(false);
    }
  };

  // ----------------------------------------------------
  // HANDLERS FOR DATABASE SELECTION
  // ----------------------------------------------------
  const handleSelectFood = (food: FoodDatabaseItem) => {
    setSelectedFoodItem(food);
    setPortionGrams(food.defaultGrams);
  };

  const handleAdjustGrams = (delta: number) => {
    setPortionGrams((prev) => Math.max(5, prev + delta));
  };

  // ----------------------------------------------------
  // AUTO-CALCULATE 4-4-9 FOR MANUAL TAB
  // ----------------------------------------------------
  const handleAutoCalculateManualCalories = () => {
    const calc = Math.round(manualProtein * 4 + manualCarbs * 4 + manualFat * 9);
    setManualCalories(calc);
  };

  // ----------------------------------------------------
  // SUBMISSIONS
  // ----------------------------------------------------
  // Save items from Photo scan
  const handleSavePhotoItems = () => {
    if (detectedPhotoItems.length === 0) return;
    const today = new Date().toISOString().split('T')[0];

    detectedPhotoItems.forEach((item) => {
      onAddFood({
        date: today,
        mealType: selectedMealType,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        portion: item.portion,
        imageUrl: photoBase64 || undefined,
      });
    });

    onClose();
  };

  // Save items from Text scan
  const handleSaveTextItems = () => {
    if (parsedTextItems.length === 0) return;
    const today = new Date().toISOString().split('T')[0];

    parsedTextItems.forEach((item) => {
      onAddFood({
        date: today,
        mealType: selectedMealType,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        portion: item.portion,
      });
    });

    onClose();
  };

  // Save single item from Database
  const handleSaveDatabaseItem = () => {
    if (!selectedFoodItem || !selectedFoodNutrition) return;
    const today = new Date().toISOString().split('T')[0];

    onAddFood({
      date: today,
      mealType: selectedMealType,
      name: selectedFoodItem.name,
      calories: selectedFoodNutrition.calories,
      protein: selectedFoodNutrition.protein,
      carbs: selectedFoodNutrition.carbs,
      fat: selectedFoodNutrition.fat,
      portion: selectedFoodNutrition.portion,
    });

    onClose();
  };

  // Save manual offline item
  const handleSaveManualItem = () => {
    if (!manualName.trim()) return;
    const today = new Date().toISOString().split('T')[0];

    const cals =
      manualCalories > 0
        ? manualCalories
        : Math.round(manualProtein * 4 + manualCarbs * 4 + manualFat * 9);

    onAddFood({
      date: today,
      mealType: selectedMealType,
      name: manualName.trim(),
      calories: cals,
      protein: manualProtein,
      carbs: manualCarbs,
      fat: manualFat,
      portion: manualPortion.trim() || '1 porção',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0b1633] to-[#070e20] border border-[#1d3363] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-[#162952] flex items-center justify-between bg-[#08122a]/90">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <Flame className="w-4 h-4" />
              </span>
              Adicionar Alimento & Calorias
            </h3>
            <p className="text-xs text-slate-400">
              Escolha o método mais prático para registrar sua refeição
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#13244a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MEAL DESTINATION SELECTOR */}
        <div className="px-5 py-2.5 bg-[#060c1c] border-b border-[#162952] flex flex-wrap items-center gap-2 justify-between">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Refeição de Destino:
          </span>
          <div className="flex flex-wrap gap-1">
            {MEAL_OPTIONS.map((m) => {
              const active = selectedMealType === m.type;
              return (
                <button
                  key={m.type}
                  onClick={() => setSelectedMealType(m.type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                      : 'bg-[#101e3d] text-slate-300 hover:bg-[#172c5a] hover:text-white'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="grid grid-cols-4 bg-[#08132c] border-b border-[#162952] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0e2048]'
            }`}
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span className="truncate">📸 Foto IA</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0e2048]'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate">✍️ Descrever</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0e2048]'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span className="truncate">📚 Banco</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0e2048]'
            }`}
          >
            <PenTool className="w-4 h-4 shrink-0" />
            <span className="truncate">✏️ Manual</span>
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* ==================================================== */}
          {/* TAB 1: 📸 FOTO COM IA                                */}
          {/* ==================================================== */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-200">
                  <strong className="text-amber-400 font-bold">Identificação Visual Inteligente:</strong> Tire uma foto do seu prato ou envie uma imagem da galeria. A IA identifica os ingredientes, estima o peso e calcula as calorias e macronutrientes.
                </div>
              </div>

              {/* Photo Upload / Camera Area */}
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {!photoBase64 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#1f376a] hover:border-amber-400/60 rounded-3xl p-8 text-center cursor-pointer transition-all bg-[#08122a]/50 hover:bg-[#0a1736]"
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-3">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      Tirar Foto ou Escolher da Galeria
                    </div>
                    <div className="text-xs text-slate-400 max-w-sm mx-auto">
                      Fotografe seu prato de cima com boa iluminação para máxima precisão na estimativa
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-[#1f376a] bg-black max-h-64 flex items-center justify-center">
                      <img
                        src={photoBase64}
                        alt="Foto da refeição"
                        className="w-full h-64 object-cover object-center"
                      />
                      <button
                        onClick={() => {
                          setPhotoBase64(null);
                          setDetectedPhotoItems([]);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-rose-600 text-white transition-colors backdrop-blur-md"
                        title="Remover foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Observação opcional para a IA (ex: "tem 1 colher de azeite", "leite desnatado"):
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: sem óleo, carne bem passada, 2 fatias..."
                        value={photoPrompt}
                        onChange={(e) => setPhotoPrompt(e.target.value)}
                        className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      onClick={handleAnalyzePhoto}
                      disabled={isAnalyzingPhoto}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isAnalyzingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analisando prato com IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Identificar Alimentos & Calcular Calorias
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {photoError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}

              {/* Detected Items from Photo */}
              {detectedPhotoItems.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-[#162952]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-400" />
                        {photoMealName || 'Itens Identificados'}
                      </h4>
                      {photoHealthTip && (
                        <p className="text-[11px] text-amber-300 mt-0.5">{photoHealthTip}</p>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                      Total: {detectedPhotoItems.reduce((acc, cur) => acc + cur.calories, 0)} kcal
                    </span>
                  </div>

                  <div className="space-y-2">
                    {detectedPhotoItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 bg-[#060c19] border border-[#17284f] rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDetectedPhotoItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, name: val } : it))
                              );
                            }}
                            className="font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-amber-400 focus:outline-none w-full"
                          />
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300 font-mono">
                            <span>{item.portion}</span>
                            <span>•</span>
                            <span className="text-amber-400">{item.calories} kcal</span>
                            <span>•</span>
                            <span className="text-rose-400">P: {item.protein}g</span>
                            <span>•</span>
                            <span className="text-yellow-400">C: {item.carbs}g</span>
                            <span>•</span>
                            <span className="text-sky-400">G: {item.fat}g</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setDetectedPhotoItems((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSavePhotoItems}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Adicionar Todos os {detectedPhotoItems.length} Itens ao Diário
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: ✍️ DESCREVER COM IA & OFFLINE                */}
          {/* ==================================================== */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-200">
                  <strong className="text-amber-400 font-bold">Linguagem Natural:</strong> Escreva como quiser (ex: "comi 200g de patinho moído com arroz e feijão"). A IA identifica os alimentos e quantidades automaticamente com fallback offline garantido.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  O que você comeu ou bebeu?
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: 200g de peito de frango grelhado, 150g de arroz integral e 1 concha de feijão carioca..."
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  className="w-full p-3 bg-[#060c19] border border-[#17284f] rounded-2xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Quick suggestion chips */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 mb-2">Exemplos Práticos Rápidos:</div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TEXT_EXAMPLES.map((ex, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTextDescription(ex);
                        handleAnalyzeText(ex);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#0e1c3a] hover:bg-[#162d5e] text-slate-300 hover:text-amber-300 text-[11px] border border-[#182e5e] transition-colors text-left"
                    >
                      ⚡ {ex}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleAnalyzeText()}
                disabled={isAnalyzingText || !textDescription.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isAnalyzingText ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando ingredientes e calorias...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Calcular Automaticamente & Detalhar Macros
                  </>
                )}
              </button>

              {textError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{textError}</span>
                </div>
              )}

              {/* Parsed Items from Text */}
              {parsedTextItems.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-[#162952]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-400" />
                        {textMealName || 'Itens Calculados'}
                      </h4>
                      {textHealthTip && (
                        <p className="text-[11px] text-amber-300 mt-0.5">{textHealthTip}</p>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                      Total: {parsedTextItems.reduce((acc, cur) => acc + cur.calories, 0)} kcal
                    </span>
                  </div>

                  <div className="space-y-2">
                    {parsedTextItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 bg-[#060c19] border border-[#17284f] rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParsedTextItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, name: val } : it))
                              );
                            }}
                            className="font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-amber-400 focus:outline-none w-full"
                          />
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300 font-mono">
                            <span>{item.portion}</span>
                            <span>•</span>
                            <span className="text-amber-400">{item.calories} kcal</span>
                            <span>•</span>
                            <span className="text-rose-400">P: {item.protein}g</span>
                            <span>•</span>
                            <span className="text-yellow-400">C: {item.carbs}g</span>
                            <span>•</span>
                            <span className="text-sky-400">G: {item.fat}g</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setParsedTextItems((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveTextItems}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Adicionar Todos os {parsedTextItems.length} Itens ao Diário
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: 📚 BANCO DE ALIMENTOS COMPLETO                */}
          {/* ==================================================== */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar no banco de alimentos (ex: frango, arroz, aveia, banana, whey)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                        active
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                          : 'bg-[#0a152d] text-slate-300 hover:bg-[#102042] border border-[#172a54]'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Selected Food Configuration Banner */}
              {selectedFoodItem && selectedFoodNutrition && (
                <div className="p-4 bg-gradient-to-br from-[#0e1d40] to-[#0a152e] border-2 border-amber-400/50 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Alimento Selecionado
                      </span>
                      <h4 className="text-base font-black text-white">{selectedFoodItem.name}</h4>
                      <p className="text-xs text-slate-300">{selectedFoodItem.servingDescription}</p>
                    </div>
                    <button
                      onClick={() => setSelectedFoodItem(null)}
                      className="text-slate-400 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Portion Grams Stepper */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Quantidade / Peso:</span>
                      <span className="text-amber-400 font-mono font-bold text-sm">
                        {portionGrams}g
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdjustGrams(-50)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#14264e] hover:bg-[#1a3369] text-xs font-bold text-slate-200"
                      >
                        -50g
                      </button>
                      <button
                        onClick={() => handleAdjustGrams(-10)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#14264e] hover:bg-[#1a3369] text-xs font-bold text-slate-200"
                      >
                        -10g
                      </button>
                      <input
                        type="number"
                        min="5"
                        max="2000"
                        value={portionGrams}
                        onChange={(e) => setPortionGrams(Math.max(1, Number(e.target.value)))}
                        className="flex-1 px-3 py-1.5 bg-[#060c19] border border-[#17284f] rounded-lg text-white font-mono font-bold text-center text-xs focus:outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={() => handleAdjustGrams(10)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#14264e] hover:bg-[#1a3369] text-xs font-bold text-slate-200"
                      >
                        +10g
                      </button>
                      <button
                        onClick={() => handleAdjustGrams(50)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#14264e] hover:bg-[#1a3369] text-xs font-bold text-slate-200"
                      >
                        +50g
                      </button>
                    </div>
                  </div>

                  {/* Real-time Calculated Nutrition Cards */}
                  <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono">
                    <div className="p-2 rounded-xl bg-[#060c19] border border-[#17284f]">
                      <div className="text-[10px] text-amber-400 font-sans font-bold">Calorias</div>
                      <div className="text-sm font-black text-white">{selectedFoodNutrition.calories}</div>
                      <div className="text-[9px] text-slate-400 font-sans">kcal</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#060c19] border border-[#17284f]">
                      <div className="text-[10px] text-rose-400 font-sans font-bold">Proteína</div>
                      <div className="text-sm font-black text-white">{selectedFoodNutrition.protein}g</div>
                      <div className="text-[9px] text-slate-400 font-sans">4 kcal/g</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#060c19] border border-[#17284f]">
                      <div className="text-[10px] text-amber-300 font-sans font-bold">Carbos</div>
                      <div className="text-sm font-black text-white">{selectedFoodNutrition.carbs}g</div>
                      <div className="text-[9px] text-slate-400 font-sans">4 kcal/g</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#060c19] border border-[#17284f]">
                      <div className="text-[10px] text-sky-400 font-sans font-bold">Gordura</div>
                      <div className="text-sm font-black text-white">{selectedFoodNutrition.fat}g</div>
                      <div className="text-[9px] text-slate-400 font-sans">9 kcal/g</div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveDatabaseItem}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Confirmar e Adicionar ao Diário
                  </button>
                </div>
              )}

              {/* Food List from Database */}
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {filteredFoods.map((food) => {
                  const isSelected = selectedFoodItem?.id === food.id;
                  return (
                    <div
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#122349] border-amber-400/80 shadow-md'
                          : 'bg-[#060c19] hover:bg-[#0c1833] border-[#15274d]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-white truncate">{food.name}</div>
                        <div className="text-slate-400 text-[11px] truncate">
                          {food.servingDescription}
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <div className="font-bold text-amber-400">
                          {food.caloriesPer100g} kcal
                          <span className="text-[10px] font-normal text-slate-400 font-sans">
                            {' '}/ 100g
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          P: {food.proteinPer100g}g • C: {food.carbsPer100g}g • G: {food.fatPer100g}g
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredFoods.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-[#17284f] rounded-2xl">
                    Nenhum alimento encontrado para "{searchQuery}".
                    <div className="mt-2 text-amber-400">
                      Você pode adicionar manualmente na aba <strong>✏️ Manual</strong>!
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: ✏️ MANUAL / OFFLINE                           */}
          {/* ==================================================== */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                <Calculator className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-200">
                  <strong className="text-sky-400 font-bold">100% Offline & Direto:</strong> Insira o nome, porção e macronutrientes. O botão de auto-cálculo utiliza a regra biológica dos 4-4-9 (4 kcal por g de proteína e carboidrato, 9 kcal por g de gordura).
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Alimento ou Refeição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tapioca com Queijo Coalho e Café"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Porção ou Quantidade
                </label>
                <input
                  type="text"
                  placeholder="Ex: 1 unidade (120g), 2 fatias, 1 prato..."
                  value={manualPortion}
                  onChange={(e) => setManualPortion(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-rose-400 mb-1">
                    Proteína (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={manualProtein || ''}
                    onChange={(e) => setManualProtein(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-300 mb-1">
                    Carboidratos (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={manualCarbs || ''}
                    onChange={(e) => setManualCarbs(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-sky-400 mb-1">
                    Gorduras (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={manualFat || ''}
                    onChange={(e) => setManualFat(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#060c19] border border-[#17284f] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">
                    Calorias Totais (kcal)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoCalculateManualCalories}
                    className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[11px] font-bold transition-all"
                  >
                    ⚡ Auto-Calcular (4-4-9)
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="Ex: 350"
                  value={manualCalories || ''}
                  onChange={(e) => setManualCalories(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#08122a] border border-[#17284f] rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={handleSaveManualItem}
                disabled={!manualName.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Salvar Alimento no Diário
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
