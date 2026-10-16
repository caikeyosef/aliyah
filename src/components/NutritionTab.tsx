import React, { useState } from 'react';
import {
  UserProfile,
  FoodLogItem,
  MealType,
} from '../types/fitness';
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Droplet,
  Search,
  Check,
  AlertCircle,
  Loader2,
  PieChart,
  Calculator,
} from 'lucide-react';
import { FoodCalculatorModal } from './FoodCalculatorModal';
import { parseMealTextMathematically } from '../utils/offlineNutritionMath';

interface NutritionTabProps {
  profile: UserProfile;
  foodLogs: FoodLogItem[];
  onAddFood: (item: Omit<FoodLogItem, 'id' | 'createdAt'>) => void;
  onDeleteFood: (id: string) => void;
  targetWater: number;
  onNavigateToHydration?: () => void;
}

const MEAL_SECTIONS: Array<{ type: MealType; title: string; desc: string; icon: string }> = [
  { type: 'breakfast', title: 'Café da Manhã', desc: 'Primeira refeição do dia', icon: '🍳' },
  { type: 'lunch', title: 'Almoço', desc: 'Refeição principal diurna', icon: '🍛' },
  { type: 'afternoon_snack', title: 'Lanche da Tarde', desc: 'Pré/Pós-treino ou lanche intermediário', icon: '🍌' },
  { type: 'dinner', title: 'Jantar', desc: 'Refeição noturna', icon: '🍲' },
  { type: 'snacks', title: 'Ceia & Lanches Extras', desc: 'Frutas, shakes ou snacks', icon: '🥛' },
];

const COMMON_FIT_FOODS = [
  { name: 'Peito de Frango Grelhado (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Arroz Branco Cozido (100g)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Feijão Carioca Cozido (100g)', calories: 76, protein: 4.8, carbs: 13.6, fat: 0.5 },
  { name: 'Ovo Inteiro Cozido (1 unidade)', calories: 75, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { name: 'Whey Protein Concentrado (30g)', calories: 120, protein: 24, carbs: 2.5, fat: 1.8 },
  { name: 'Banana Prata (1 média)', calories: 98, protein: 1.3, carbs: 26, fat: 0.3 },
  { name: 'Aveia em Flocos (30g)', calories: 110, protein: 4.2, carbs: 17, fat: 2.2 },
  { name: 'Batata Doce Cozida (100g)', calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: 'Pasta de Amendoim Integral (15g)', calories: 90, protein: 4, carbs: 3, fat: 7.5 },
];

export const NutritionTab: React.FC<NutritionTabProps> = ({
  profile,
  foodLogs,
  onAddFood,
  onDeleteFood,
  targetWater,
  onNavigateToHydration,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isFoodCalculatorOpen, setIsFoodCalculatorOpen] = useState(false);
  const [calculatorMealType, setCalculatorMealType] = useState<MealType>('lunch');

  // Text AI Modal / Prompt
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  // Manual Quick Add Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualMealType, setManualMealType] = useState<MealType>('lunch');
  const [manualName, setManualName] = useState('');
  const [manualPortion, setManualPortion] = useState('1 porção');
  const [manualCalories, setManualCalories] = useState<number>(0);
  const [manualProtein, setManualProtein] = useState<number>(0);
  const [manualCarbs, setManualCarbs] = useState<number>(0);
  const [manualFat, setManualFat] = useState<number>(0);

  // Water tracker
  const [waterLoggedMl, setWaterLoggedMl] = useState<number>(2000);

  // Filter logs for selected date
  const dayLogs = foodLogs.filter((log) => log.date === selectedDate);

  // Calculate day totals
  const totalCalories = dayLogs.reduce((acc, cur) => acc + cur.calories, 0);
  const totalProtein = dayLogs.reduce((acc, cur) => acc + cur.protein, 0);
  const totalCarbs = dayLogs.reduce((acc, cur) => acc + cur.carbs, 0);
  const totalFat = dayLogs.reduce((acc, cur) => acc + cur.fat, 0);

  const caloriesRemaining = profile.targetCalories - totalCalories;
  const calPercent = Math.min(100, Math.round((totalCalories / profile.targetCalories) * 100));

  // Date shifting
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleOpenFoodCalculator = (mealType: MealType) => {
    setCalculatorMealType(mealType);
    setIsFoodCalculatorOpen(true);
  };

  const handleQuickAddCommon = (food: (typeof COMMON_FIT_FOODS)[0], mealType: MealType) => {
    onAddFood({
      date: selectedDate,
      mealType,
      name: food.name,
      portion: 'Padrão',
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    });
  };

  const handleAnalyzeTextFood = () => {
    if (!textPrompt.trim()) return;
    setIsAnalyzingText(true);
    setTextError(null);

    try {
      const data = parseMealTextMathematically(textPrompt);
      onAddFood({
        date: selectedDate,
        mealType: manualMealType,
        name: data.foodName || textPrompt,
        portion: data.servingEstimate || 'Porção calculada',
        calories: Number(data.calories) || 0,
        protein: Number(data.protein) || 0,
        carbs: Number(data.carbs) || 0,
        fat: Number(data.fat) || 0,
        fiber: data.fiber,
        aiAnalyzed: false,
        aiConfidence: 100,
        healthTip: data.healthTip,
        items: data.items,
      });

      setTextPrompt('');
      setIsTextModalOpen(false);
    } catch (e: any) {
      setTextError(e.message || 'Erro ao calcular macros');
    } finally {
      setIsAnalyzingText(false);
    }
  };

  const handleSaveManualFood = () => {
    if (!manualName.trim()) return;
    onAddFood({
      date: selectedDate,
      mealType: manualMealType,
      name: manualName.trim(),
      portion: manualPortion.trim() || '1 porção',
      calories: Number(manualCalories) || 0,
      protein: Number(manualProtein) || 0,
      carbs: Number(manualCarbs) || 0,
      fat: Number(manualFat) || 0,
    });

    setManualName('');
    setManualCalories(0);
    setManualProtein(0);
    setManualCarbs(0);
    setManualFat(0);
    setIsManualModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Date Header Selector */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <button
          onClick={() => shiftDate(-1)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="text-sm font-bold text-white">
            {selectedDate === new Date().toISOString().split('T')[0]
              ? 'Hoje'
              : new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
          </div>
          <div className="text-xs text-slate-400 font-mono">{selectedDate}</div>
        </div>

        <button
          onClick={() => shiftDate(1)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Daily Macros & Calorie Card */}
      <div className="bg-gradient-to-br from-[#0a142c] to-[#070e20] border border-[#1a2d56] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Calorie Ring / Numbers in Gold & Mustard */}
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-[#132247]"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - calPercent / 100)}
                  strokeLinecap="round"
                  className="text-amber-400 transition-all duration-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-lg font-black text-white font-mono">{calPercent}%</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Balanço Calórico de Hoje
              </span>
              <div className="text-3xl font-black text-white font-mono mt-1">
                {totalCalories}{' '}
                <span className="text-sm font-normal text-slate-400 font-sans">
                  / {profile.targetCalories} kcal
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {caloriesRemaining >= 0 ? (
                  <span className="text-amber-400 font-medium">
                    Restam {caloriesRemaining} kcal para atingir a meta
                  </span>
                ) : (
                  <span className="text-rose-400 font-medium">
                    Excedeu a meta em {Math.abs(caloriesRemaining)} kcal
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action trigger buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => handleOpenFoodCalculator('lunch')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4" /> Calculadora de Alimentos
            </button>
            <button
              onClick={() => setIsTextModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#122247] hover:bg-[#182f61] text-amber-200 border border-[#a16207]/40 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> Calcular por Texto
            </button>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-[#122247] hover:bg-[#182f61] text-slate-200 border border-[#1a2d56] text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Manual
            </button>
          </div>
        </div>

        {/* Macro Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#17284f]">
          {/* Protein */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-rose-300">Proteínas</span>
              <span className="text-slate-200 font-mono">
                {totalProtein}g / {profile.targetProtein}g
              </span>
            </div>
            <div className="h-2 bg-[#122044] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (totalProtein / profile.targetProtein) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-amber-300">Carboidratos</span>
              <span className="text-slate-200 font-mono">
                {totalCarbs}g / {profile.targetCarbs}g
              </span>
            </div>
            <div className="h-2 bg-[#122044] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (totalCarbs / profile.targetCarbs) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Fats */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-amber-200">Gorduras</span>
              <span className="text-slate-200 font-mono">
                {totalFat}g / {profile.targetFat}g
              </span>
            </div>
            <div className="h-2 bg-[#122044] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#b45309] rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (totalFat / profile.targetFat) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Water tracker banner */}
        <div className="mt-5 pt-4 border-t border-[#17284f] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-medium">
            <Droplet className="w-4 h-4 shrink-0 fill-amber-400 text-amber-400" />
            <span>
              Hidratação Diária:{' '}
              <strong className="text-white font-mono">{(targetWater / 1000).toFixed(1)}L recomendados</strong>
            </span>
          </div>
          {onNavigateToHydration && (
            <button
              onClick={onNavigateToHydration}
              className="px-3.5 py-1.5 rounded-xl bg-[#122247] hover:bg-[#182f61] text-amber-200 border border-[#a16207]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Abrir Aba de Hidratação</span>
              <Droplet className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* Meal Sections */}
      <div className="space-y-4">
        {MEAL_SECTIONS.map((section) => {
          const sectionItems = dayLogs.filter((item) => item.mealType === section.type);
          const sectionCals = sectionItems.reduce((acc, cur) => acc + cur.calories, 0);
          const sectionProt = sectionItems.reduce((acc, cur) => acc + cur.protein, 0);

          return (
            <div
              key={section.type}
              className="bg-[#0a142c] border border-[#1a2d56] rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{section.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{section.title}</h4>
                    <p className="text-xs text-slate-300">
                      {sectionCals > 0
                        ? `${sectionCals} kcal • ${sectionProt}g proteína`
                        : section.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenFoodCalculator(section.type)}
                    className="p-2 rounded-xl bg-[#122247] hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 text-xs border border-[#17284f] transition-colors cursor-pointer"
                    title="Buscar na Tabela de Alimentos"
                  >
                    <Search className="w-4 h-4 text-amber-400" />
                  </button>
                  <button
                    onClick={() => {
                      setManualMealType(section.type);
                      setIsManualModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-[#122247] hover:bg-[#182f61] text-amber-200 text-xs border border-[#a16207]/40 transition-colors"
                    title="Adicionar manualmente"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Logged items in this meal */}
              {sectionItems.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {sectionItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#060c19] border border-[#17284f] rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[#1a2d56] shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#122247] border border-[#1a2d56] flex items-center justify-center text-slate-300 shrink-0">
                            🍲
                          </div>
                        )}
                        <div className="truncate">
                          <div className="font-semibold text-white truncate flex items-center gap-1.5">
                            {item.name}
                          </div>
                          <div className="text-slate-300 text-[11px] font-mono mt-0.5">
                            {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • G:{' '}
                            {item.fat}g {item.portion ? `• ${item.portion}` : ''}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteFood(item.id)}
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-[#122247] transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-xs text-slate-400 border border-dashed border-[#17284f] rounded-xl bg-[#060c19]/50">
                  Nenhum alimento registrado ainda nesta refeição.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Common Foods Quick-Picker Card */}
      <div className="bg-[#0a142c] border border-[#1a2d56] rounded-2xl p-5">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>⚡ Adição Rápida de Alimentos Frequentes</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {COMMON_FIT_FOODS.map((food, idx) => (
            <div
              key={idx}
              className="p-3 bg-[#060c19] hover:bg-[#0d1a38] border border-[#17284f] rounded-xl flex items-center justify-between text-xs transition-colors"
            >
              <div>
                <div className="font-semibold text-white">{food.name}</div>
                <div className="text-slate-300 text-[11px] font-mono">
                  {food.calories} kcal • {food.protein}g prot
                </div>
              </div>
              <button
                onClick={() => handleQuickAddCommon(food, 'lunch')}
                className="p-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 hover:from-amber-500 hover:to-yellow-500 hover:text-slate-950 font-bold text-[11px] transition-all"
                title="Adicionar ao almoço"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Tabela de Alimentos & Calculadora Nutricional Offline */}
      <FoodCalculatorModal
        isOpen={isFoodCalculatorOpen}
        onClose={() => setIsFoodCalculatorOpen(false)}
        onAddFood={onAddFood}
        defaultMealType={calculatorMealType}
      />

      {/* MODAL: AI Natural Language Text Logger */}
      {isTextModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060f]/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#17284f] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-400" />
                  Calculadora Nutricional por Texto
                </h3>
                <p className="text-[11px] text-slate-300">
                  Cálculo determinístico offline com base na Tabela Brasileira e regra matemática 4-4-9
                </p>
              </div>
              <button
                onClick={() => setIsTextModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {textError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{textError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Refeição de destino
              </label>
              <select
                value={manualMealType}
                onChange={(e) => setManualMealType(e.target.value as MealType)}
                className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="breakfast">Café da Manhã</option>
                <option value="lunch">Almoço</option>
                <option value="afternoon_snack">Lanche da Tarde</option>
                <option value="dinner">Jantar</option>
                <option value="snacks">Ceia & Lanches</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                O que você comeu?
              </label>
              <textarea
                rows={3}
                placeholder="Ex: 200g de frango grelhado e 150g de arroz branco, ou 2 ovos e 1 banana..."
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={handleAnalyzeTextFood}
              disabled={isAnalyzingText || !textPrompt.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isAnalyzingText ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculando macros pela fórmula 4-4-9...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Calcular Macros Matematicamente e Salvar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Manual Add Food */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060f]/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0a142c] border border-[#1a2d56] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#17284f] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Adicionar Alimento Manual
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Refeição</label>
              <select
                value={manualMealType}
                onChange={(e) => setManualMealType(e.target.value as MealType)}
                className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="breakfast">Café da Manhã</option>
                <option value="lunch">Almoço</option>
                <option value="afternoon_snack">Lanche da Tarde</option>
                <option value="dinner">Jantar</option>
                <option value="snacks">Ceia & Lanches</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Alimento
              </label>
              <input
                type="text"
                placeholder="Ex: Iogurte Grego com Granola"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Porção</label>
                <input
                  type="text"
                  placeholder="Ex: 150g ou 1 copo"
                  value={manualPortion}
                  onChange={(e) => setManualPortion(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Calorias (kcal)
                </label>
                <input
                  type="number"
                  placeholder="250"
                  value={manualCalories || ''}
                  onChange={(e) => setManualCalories(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-rose-400 font-bold mb-1">Proteína (g)</label>
                <input
                  type="number"
                  value={manualProtein || ''}
                  onChange={(e) => setManualProtein(Number(e.target.value))}
                  className="w-full px-2 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-amber-400 font-bold mb-1">Carbos (g)</label>
                <input
                  type="number"
                  value={manualCarbs || ''}
                  onChange={(e) => setManualCarbs(Number(e.target.value))}
                  className="w-full px-2 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-sky-400 font-bold mb-1">Gordura (g)</label>
                <input
                  type="number"
                  value={manualFat || ''}
                  onChange={(e) => setManualFat(Number(e.target.value))}
                  className="w-full px-2 py-2 bg-[#060c19] border border-[#17284f] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              onClick={handleSaveManualFood}
              disabled={!manualName.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all"
            >
              <Check className="w-4 h-4" /> Salvar no Diário
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
