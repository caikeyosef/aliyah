import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  Search,
  Calculator,
  Utensils,
  Sparkles,
} from 'lucide-react';
import { MealType, FoodLogItem } from '../types/fitness';
import {
  FoodDatabaseItem,
  calculatePortionNutrition,
  parseMealTextMathematically,
  searchOfflineFoods,
} from '../utils/offlineNutritionMath';

interface FoodCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (item: Omit<FoodLogItem, 'id' | 'createdAt'>) => void;
  defaultMealType?: MealType;
}

export const FoodCalculatorModal: React.FC<FoodCalculatorModalProps> = ({
  isOpen,
  onClose,
  onAddFood,
  defaultMealType = 'lunch',
}) => {
  const [activeTab, setActiveTab] = useState<'database' | 'text_calc'>('database');
  const [selectedMealType, setSelectedMealType] = useState<MealType>(defaultMealType);

  // Search in database state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodDatabaseItem | null>(null);
  const [portionGrams, setPortionGrams] = useState<number>(100);

  // Text formula state
  const [textInput, setTextInput] = useState('');

  // Editable fields for final review before saving
  const [editedName, setEditedName] = useState('');
  const [editedPortion, setEditedPortion] = useState('100g');
  const [editedCalories, setEditedCalories] = useState<number>(0);
  const [editedProtein, setEditedProtein] = useState<number>(0);
  const [editedCarbs, setEditedCarbs] = useState<number>(0);
  const [editedFat, setEditedFat] = useState<number>(0);
  const [healthTip, setHealthTip] = useState('');

  // Filtered food list
  const filteredFoods = useMemo(() => {
    return searchOfflineFoods(searchQuery);
  }, [searchQuery]);

  if (!isOpen) return null;

  // Select food from offline database
  const handleSelectFoodItem = (food: FoodDatabaseItem) => {
    setSelectedFood(food);
    setPortionGrams(food.defaultGrams);
    const n = calculatePortionNutrition(food, food.defaultGrams);

    setEditedName(food.name);
    setEditedPortion(`${food.defaultGrams}g (${food.servingDescription})`);
    setEditedCalories(n.calories);
    setEditedProtein(n.protein);
    setEditedCarbs(n.carbs);
    setEditedFat(n.fat);
    setHealthTip(`Tabela Nutricional: ${food.name}. Regra exata 4-4-9 (4 kcal por g de proteína e carbo, 9 kcal por g de gordura).`);
  };

  // Update portion grams in real-time
  const handleUpdatePortionGrams = (grams: number) => {
    setPortionGrams(grams);
    if (selectedFood) {
      const n = calculatePortionNutrition(selectedFood, grams);
      setEditedPortion(`${grams}g`);
      setEditedCalories(n.calories);
      setEditedProtein(n.protein);
      setEditedCarbs(n.carbs);
      setEditedFat(n.fat);
    }
  };

  // Parse natural meal text mathematically
  const handleCalculateFromText = () => {
    if (!textInput.trim()) return;
    const res = parseMealTextMathematically(textInput);
    setEditedName(res.foodName);
    setEditedPortion(res.servingEstimate);
    setEditedCalories(res.calories);
    setEditedProtein(res.protein);
    setEditedCarbs(res.carbs);
    setEditedFat(res.fat);
    setHealthTip(res.healthTip);
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
      aiAnalyzed: false,
      healthTip: healthTip || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setSelectedFood(null);
    setTextInput('');
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#03060f]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0a142c] border border-[#1a2d56] rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#17284f] flex items-center justify-between bg-[#081022]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/25 shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                Tabela & Calculadora de Alimentos
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 truncate">
                Cálculo exato de calorias e macronutrientes pela regra 4-4-9
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#122247] text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subnav Tabs */}
        <div className="flex border-b border-[#17284f] bg-[#060c19] px-4 sm:px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'database'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Tabela de Alimentos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text_calc')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'text_calc'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" /> Estimativa por Texto
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {/* Meal selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-[#060c19] p-3 rounded-2xl border border-[#17284f]">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-amber-400" /> Refeição de Destino:
            </span>
            <select
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value as MealType)}
              className="w-full sm:w-auto px-3 py-1.5 bg-[#0a142c] border border-[#1a2d56] rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
            >
              <option value="breakfast">🍳 Café da Manhã</option>
              <option value="lunch">🍛 Almoço</option>
              <option value="afternoon_snack">🍌 Lanche da Tarde</option>
              <option value="dinner">🍲 Jantar</option>
              <option value="snacks">🥛 Ceia / Outro</option>
            </select>
          </div>

          {/* TAB 1: Search in offline food table */}
          {activeTab === 'database' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar alimento (ex: frango, arroz, feijão, ovos, whey, banana)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#060c19] border border-[#1a2d56] rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Food selection grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredFoods.map((f) => {
                  const isSelected = selectedFood?.id === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelectFoodItem(f)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#152957] border-amber-400/80 shadow-md shadow-amber-400/10'
                          : 'bg-[#060c19] border-[#17284f] hover:border-[#1e366a]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-white truncate">{f.name}</div>
                        <div className="text-xs text-slate-400 truncate">{f.servingDescription}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-amber-400">
                          {f.caloriesPer100g} kcal
                        </div>
                        <div className="text-xs text-slate-400 font-mono">/ 100g</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Real-time Portion Slider */}
              {selectedFood && (
                <div className="p-3.5 sm:p-4 bg-[#060c19] border border-[#17284f] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-bold text-white">{selectedFood.name}</span>
                      <span className="text-[11px] text-slate-400 block">
                        Porção ajustada: {portionGrams}g
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        step="5"
                        value={portionGrams}
                        onChange={(e) => handleUpdatePortionGrams(Math.max(1, Number(e.target.value)))}
                        className="w-20 px-2 py-1 bg-[#0a142c] border border-[#1a2d56] rounded-lg text-white font-mono font-bold text-xs text-center focus:border-amber-400"
                      />
                      <span className="text-xs text-amber-400 font-mono font-bold">gramas</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={portionGrams}
                    onChange={(e) => handleUpdatePortionGrams(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Text math estimation */}
          {activeTab === 'text_calc' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Descreva os alimentos e quantidades em gramas ou unidades:
              </label>
              <textarea
                rows={3}
                placeholder="Ex: 150g peito de frango, 200g arroz branco e 1 concha de feijão..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#060c19] border border-[#1a2d56] rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleCalculateFromText}
                disabled={!textInput.trim()}
                className="w-full py-2.5 rounded-xl bg-[#122247] hover:bg-[#182f61] border border-[#a16207]/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-amber-400" />
                Calcular Macronutrientes Matematicamente
              </button>
            </div>
          )}

          {/* Review & Final Confirmation Card */}
          <div className="space-y-3.5 pt-3 border-t border-[#17284f]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Resumo Nutricional Pronto para Salvar
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono">
                Regra 4-4-9 Exata
              </span>
            </div>

            {/* Editable Name & Total Calories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nome do Alimento / Refeição</label>
                <input
                  type="text"
                  placeholder="Ex: Peito de Frango com Arroz"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060c19] border border-[#1a2d56] rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Calorias Totais (kcal)</label>
                <input
                  type="number"
                  value={editedCalories || ''}
                  onChange={(e) => setEditedCalories(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#060c19] border border-[#1a2d56] rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Editable Macros */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#060c19] p-2 sm:p-2.5 rounded-xl border border-rose-500/20">
                <span className="text-xs font-bold text-rose-400 uppercase">Proteína</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={editedProtein || ''}
                    onChange={(e) => setEditedProtein(Number(e.target.value))}
                    className="w-14 sm:w-16 px-1 py-0.5 bg-[#0a142c] border border-[#1a2d56] rounded text-center text-white text-xs font-bold font-mono focus:border-amber-400"
                  />
                  <span className="text-xs text-slate-400">g</span>
                </div>
              </div>

              <div className="bg-[#060c19] p-2 sm:p-2.5 rounded-xl border border-amber-500/20">
                <span className="text-xs font-bold text-amber-400 uppercase">Carboidrato</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={editedCarbs || ''}
                    onChange={(e) => setEditedCarbs(Number(e.target.value))}
                    className="w-14 sm:w-16 px-1 py-0.5 bg-[#0a142c] border border-[#1a2d56] rounded text-center text-white text-xs font-bold font-mono focus:border-amber-400"
                  />
                  <span className="text-xs text-slate-400">g</span>
                </div>
              </div>

              <div className="bg-[#060c19] p-2 sm:p-2.5 rounded-xl border border-sky-500/20">
                <span className="text-xs font-bold text-sky-400 uppercase">Gorduras</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={editedFat || ''}
                    onChange={(e) => setEditedFat(Number(e.target.value))}
                    className="w-14 sm:w-16 px-1 py-0.5 bg-[#0a142c] border border-[#1a2d56] rounded text-center text-white text-xs font-bold font-mono focus:border-amber-400"
                  />
                  <span className="text-xs text-slate-400">g</span>
                </div>
              </div>
            </div>

            {/* Scientific tip */}
            {healthTip && (
              <div className="p-2.5 sm:p-3 bg-[#060c19] border border-[#a16207]/30 rounded-xl text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{healthTip}</span>
              </div>
            )}

            {/* Confirm action */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="py-2.5 sm:py-3 px-4 rounded-xl border border-[#a16207]/40 bg-[#122247] hover:bg-[#182f61] text-amber-200 text-xs font-semibold cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={!editedName.trim() || editedCalories <= 0}
                className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Salvar no Diário de Alimentação
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
