import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  Search,
  Utensils,
  Sparkles,
  Database,
  Sliders,
  Flame,
  Info,
} from 'lucide-react';
import { MealType, FoodLogItem } from '../types/fitness';
import {
  FoodCategory,
  FoodDatabaseItem,
  calculatePortionNutrition,
  calculateCaloriesFromMacros,
  searchOfflineFoods,
} from '../utils/offlineNutritionMath';

interface FoodCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (item: Omit<FoodLogItem, 'id' | 'createdAt'>) => void;
  defaultMealType?: MealType;
}

const CATEGORIES: Array<{ key: FoodCategory; label: string; icon: string }> = [
  { key: 'todos', label: 'Todos', icon: '🍽️' },
  { key: 'proteina', label: 'Proteínas', icon: '🥩' },
  { key: 'carboidrato', label: 'Carboidratos', icon: '🍚' },
  { key: 'laticinio', label: 'Laticínios', icon: '🥛' },
  { key: 'fruta', label: 'Frutas', icon: '🍌' },
  { key: 'gordura', label: 'Gorduras Boas', icon: '🥑' },
  { key: 'vegetal', label: 'Vegetais & Saladas', icon: '🥦' },
  { key: 'suplemento', label: 'Suplementos', icon: '⚡' },
  { key: 'prato', label: 'Pratos Fit', icon: '🍲' },
];

export const FoodCalculatorModal: React.FC<FoodCalculatorModalProps> = ({
  isOpen,
  onClose,
  onAddFood,
  defaultMealType = 'lunch',
}) => {
  const [selectedMealType, setSelectedMealType] = useState<MealType>(defaultMealType);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item & portion state
  const [selectedFood, setSelectedFood] = useState<FoodDatabaseItem | null>(null);
  const [portionGrams, setPortionGrams] = useState<number>(100);

  // Editable values for final verification
  const [editedName, setEditedName] = useState('');
  const [editedPortion, setEditedPortion] = useState('100g');
  const [editedCalories, setEditedCalories] = useState<number>(0);
  const [editedProtein, setEditedProtein] = useState<number>(0);
  const [editedCarbs, setEditedCarbs] = useState<number>(0);
  const [editedFat, setEditedFat] = useState<number>(0);
  const [editedFiber, setEditedFiber] = useState<number>(0);
  const [healthTip, setHealthTip] = useState('');

  // Filtered food list
  const filteredFoods = useMemo(() => {
    return searchOfflineFoods(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  // Select food from offline database
  const handleSelectFoodItem = (food: FoodDatabaseItem) => {
    setSelectedFood(food);
    const initialGrams = food.defaultGrams || 100;
    setPortionGrams(initialGrams);
    const n = calculatePortionNutrition(food, initialGrams);

    setEditedName(food.name);
    setEditedPortion(`${initialGrams}g (${food.servingDescription})`);
    setEditedCalories(n.calories);
    setEditedProtein(n.protein);
    setEditedCarbs(n.carbs);
    setEditedFat(n.fat);
    setEditedFiber(n.fiber);
    setHealthTip(
      food.micros
        ? `${food.name}: ${food.micros}.`
        : `Tabela Nutricional Exata: ${food.name}. Regra matemática 4-4-9.`
    );
  };

  // Update portion grams in real-time
  const handleUpdatePortionGrams = (grams: number) => {
    const validGrams = Math.max(1, Math.min(2000, grams));
    setPortionGrams(validGrams);
    if (selectedFood) {
      const n = calculatePortionNutrition(selectedFood, validGrams);
      setEditedPortion(`${validGrams}g (${selectedFood.servingDescription})`);
      setEditedCalories(n.calories);
      setEditedProtein(n.protein);
      setEditedCarbs(n.carbs);
      setEditedFat(n.fat);
      setEditedFiber(n.fiber);
    }
  };

  // Quick preset button click
  const handleQuickGrams = (grams: number) => {
    handleUpdatePortionGrams(grams);
  };

  // Auto-recalculate calories if user edits macros directly
  const handleMacroChange = (
    field: 'protein' | 'carbs' | 'fat' | 'fiber',
    value: number
  ) => {
    let p = editedProtein;
    let c = editedCarbs;
    let f = editedFat;
    let fib = editedFiber;

    if (field === 'protein') {
      p = value;
      setEditedProtein(value);
    } else if (field === 'carbs') {
      c = value;
      setEditedCarbs(value);
    } else if (field === 'fat') {
      f = value;
      setEditedFat(value);
    } else if (field === 'fiber') {
      fib = value;
      setEditedFiber(value);
    }

    const recalculated = calculateCaloriesFromMacros(p, c, f);
    setEditedCalories(recalculated);
  };

  // Final confirmation to add to daily log
  const handleConfirmAdd = () => {
    if (!editedName.trim()) return;

    onAddFood({
      date: new Date().toISOString().split('T')[0],
      mealType: selectedMealType,
      name: editedName.trim(),
      portion: editedPortion,
      calories: Number(editedCalories) || 0,
      protein: Number(editedProtein) || 0,
      carbs: Number(editedCarbs) || 0,
      fat: Number(editedFat) || 0,
      fiber: Number(editedFiber) || 0,
      aiAnalyzed: false,
      healthTip: healthTip || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setSelectedFood(null);
    setSearchQuery('');
    setSelectedCategory('todos');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#03060f]/85 backdrop-blur-md overflow-y-auto safe-area-top safe-area-bottom">
      <div className="relative w-full max-w-3xl bg-[#0a142c] border border-[#1a2d56] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#17284f] flex items-center justify-between bg-[#081022] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/25 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                <span>Tabela Nutricional & Calculadora</span>
                <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  Base TACO & Fit
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 truncate">
                Pesquise alimentos, ajuste os gramas e salve com a regra exata 4-4-9
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#122247] text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 ml-2 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Meal Target Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-[#060c19] p-3 rounded-2xl border border-[#17284f]">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-amber-400" /> Refeição de Destino:
            </span>
            <select
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value as MealType)}
              className="w-full sm:w-auto px-3 py-1.5 bg-[#0a142c] border border-[#1a2d56] rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="breakfast">🍳 Café da Manhã</option>
              <option value="lunch">🍛 Almoço</option>
              <option value="afternoon_snack">🍌 Lanche da Tarde</option>
              <option value="dinner">🍲 Jantar</option>
              <option value="snacks">🥛 Ceia & Lanches Extras</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome, apelido ou micronutriente (ex: frango, arroz, ovos, whey, banana, azeite, creatina)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#060c19] border border-[#1a2d56] rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    active
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'bg-[#060c19] text-slate-300 hover:text-white border border-[#17284f] hover:border-[#1e366a]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Food Grid / Results */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Alimentos disponíveis ({filteredFoods.length}):</span>
              <span>Clique no alimento para ajustar porção</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredFoods.map((f) => {
                const isSelected = selectedFood?.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectFoodItem(f)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#152957] border-amber-400 shadow-md shadow-amber-400/10'
                        : 'bg-[#060c19] border-[#17284f] hover:border-[#223d75]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{f.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {f.servingDescription}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-amber-400">
                          {f.caloriesPer100g} kcal
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">/ 100g</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#17284f]/60 text-[10px] font-mono text-slate-300">
                      <span className="text-rose-300">P: {f.proteinPer100g}g</span>
                      <span className="text-amber-300">C: {f.carbsPer100g}g</span>
                      <span className="text-sky-300">G: {f.fatPer100g}g</span>
                      <span className="text-emerald-300">Fib: {f.fiberPer100g}g</span>
                    </div>

                    {f.micros && (
                      <div className="text-[10px] text-amber-400/90 truncate flex items-center gap-1">
                        <Info className="w-3 h-3 shrink-0" />
                        <span className="truncate">{f.micros}</span>
                      </div>
                    )}
                  </button>
                );
              })}

              {filteredFoods.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-400 bg-[#060c19] border border-dashed border-[#17284f] rounded-2xl">
                  Nenhum alimento encontrado para "{searchQuery}". Você pode digitar os valores manualmente abaixo.
                </div>
              )}
            </div>
          </div>

          {/* Selected Food & Portion Controls */}
          {selectedFood && (
            <div className="p-3.5 sm:p-4 bg-[#081226] border border-amber-500/30 rounded-2xl space-y-3 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {selectedFood.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {portionGrams}g selecionados
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block truncate">
                    Referência: {selectedFood.servingDescription}
                  </span>
                </div>

                {/* Grams input box */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Quantidade:</span>
                  <input
                    type="number"
                    min="1"
                    max="2000"
                    step="5"
                    value={portionGrams}
                    onChange={(e) => handleUpdatePortionGrams(Number(e.target.value))}
                    className="w-20 px-2 py-1 bg-[#060c19] border border-[#1a2d56] rounded-lg text-white font-mono font-bold text-xs text-center focus:border-amber-400"
                  />
                  <span className="text-xs text-amber-400 font-mono font-bold">gramas</span>
                </div>
              </div>

              {/* Quick portion chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Atalhos:
                </span>
                {selectedFood.defaultGrams && selectedFood.defaultGrams !== 100 && (
                  <button
                    type="button"
                    onClick={() => handleQuickGrams(selectedFood.defaultGrams)}
                    className="px-2.5 py-1 rounded-lg bg-[#122247] hover:bg-[#182f61] border border-amber-500/30 text-[11px] font-bold text-amber-300 cursor-pointer"
                  >
                    Porção Padrão ({selectedFood.defaultGrams}g)
                  </button>
                )}
                {[50, 100, 150, 200, 250, 300].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleQuickGrams(g)}
                    className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono cursor-pointer transition-colors ${
                      portionGrams === g
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                        : 'bg-[#060c19] text-slate-300 border-[#1a2d56] hover:text-white'
                    }`}
                  >
                    {g}g
                  </button>
                ))}
              </div>

              {/* Slider for smooth visual feedback */}
              <div className="flex items-center gap-3">
                <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="range"
                  min="10"
                  max="600"
                  step="5"
                  value={portionGrams}
                  onChange={(e) => handleUpdatePortionGrams(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Micronutrient banner */}
              {selectedFood.micros && (
                <div className="p-2.5 bg-[#060c19] border border-[#17284f] rounded-xl flex items-center gap-2 text-[11px] text-amber-300/90">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Destaque Nutricional:</strong> {selectedFood.micros}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Editable Confirmation Section */}
          <div className="pt-3 border-t border-[#17284f] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Valores Prontos para o Diário
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono">
                Regra 4-4-9: (P×4) + (C×4) + (G×9)
              </span>
            </div>

            {/* Name and portion title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Nome do Alimento / Item
                </label>
                <input
                  type="text"
                  placeholder="Ex: Peito de Frango Grelhado"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060c19] border border-[#1a2d56] rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Descrição da Porção
                </label>
                <input
                  type="text"
                  placeholder="Ex: 150g ou 1 filé médio"
                  value={editedPortion}
                  onChange={(e) => setEditedPortion(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060c19] border border-[#1a2d56] rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Macro Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              {/* Calories */}
              <div className="bg-[#060c19] p-2.5 rounded-xl border border-amber-500/30 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">Calorias</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <input
                    type="number"
                    value={editedCalories || ''}
                    onChange={(e) => setEditedCalories(Number(e.target.value))}
                    className="w-16 px-1 py-0.5 bg-[#0a142c] border border-[#1a2d56] rounded text-center text-amber-300 text-xs font-black font-mono focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-400">kcal</span>
                </div>
              </div>

              {/* Protein */}
              <div className="bg-[#060c19] p-2.5 rounded-xl border border-rose-500/20">
                <span className="text-[10px] font-bold text-rose-400 uppercase block">Proteína</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={editedProtein || ''}
                    onChange={(e) => handleMacroChange('protein', Number(e.target.value))}
                    className="w-14 px-1 py-0.5 bg-[#0a142c] border border-[#1a2d56] rounded text-center text-white text-xs font-bold font-mono focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-400">g</span>
                </div>
              </div>

              {/* Carbs */}
              <div className="bg-[#060c19] p-2.5 rounded-xl border border-amber-500/20">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">Carboidrato</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={editedCarbs || ''}
                    onChange={(e) => handleMacroChange('carbs', Number(e.target.value))}
                    className="w-14 px-1 py-0.5 bg-[#0a142c] border border-[#1a2d56] rounded text-center text-white text-xs font-bold font-mono focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-400">g</span>
                </div>
              </div>

              {/* Fats */}
              <div className="bg-[#060c19] p-2.5 rounded-xl border border-sky-500/20">
                <span className="text-[10px] font-bold text-sky-400 uppercase block">Gordura</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={editedFat || ''}
                    onChange={(e) => handleMacroChange('fat', Number(e.target.value))}
                    className="w-14 px-1 py-0.5 bg-[#0a142c] border border-[#1a2d56] rounded text-center text-white text-xs font-bold font-mono focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-400">g</span>
                </div>
              </div>

              {/* Fiber */}
              <div className="bg-[#060c19] p-2.5 rounded-xl border border-emerald-500/20">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block">Fibras</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={editedFiber || ''}
                    onChange={(e) => handleMacroChange('fiber', Number(e.target.value))}
                    className="w-14 px-1 py-0.5 bg-[#0a142c] border border-[#1a2d56] rounded text-center text-white text-xs font-bold font-mono focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-400">g</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="py-2.5 px-4 rounded-xl border border-[#a16207]/40 bg-[#122247] hover:bg-[#182f61] text-amber-200 text-xs font-semibold cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={!editedName.trim() || editedCalories <= 0}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Salvar no Diário ({editedCalories} kcal)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
