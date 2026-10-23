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
  Camera,
  Database,
  PenTool,
  Zap,
} from 'lucide-react';
import { UnifiedFoodModal, FoodModalTab } from './UnifiedFoodModal';

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
  { name: 'Peito de Frango Grelhado (120g)', calories: 190, protein: 38, carbs: 0, fat: 3 },
  { name: 'Arroz Branco Cozido (120g)', calories: 154, protein: 3, carbs: 34, fat: 0.4 },
  { name: 'Feijão Carioca Cozido (100g)', calories: 76, protein: 4.8, carbs: 13.6, fat: 0.5 },
  { name: 'Ovo Inteiro Cozido (1 unidade)', calories: 73, protein: 6.7, carbs: 0.3, fat: 4.8 },
  { name: 'Whey Protein Concentrado (30g)', calories: 120, protein: 24, carbs: 1.8, fat: 1.8 },
  { name: 'Banana Prata (1 unidade 80g)', calories: 78, protein: 1, carbs: 21, fat: 0.1 },
  { name: 'Aveia em Flocos (30g)', calories: 110, protein: 4.2, carbs: 17, fat: 2.2 },
  { name: 'Batata Doce Cozida (120g)', calories: 103, protein: 1.9, carbs: 24, fat: 0.1 },
  { name: 'Pasta de Amendoim (20g)', calories: 122, protein: 5.6, carbs: 3.2, fat: 10 },
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

  // Unified Food Modal State
  const [isUnifiedModalOpen, setIsUnifiedModalOpen] = useState(false);
  const [unifiedMealType, setUnifiedMealType] = useState<MealType>('lunch');
  const [unifiedInitialTab, setUnifiedInitialTab] = useState<FoodModalTab>('database');

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

  const openAddFoodModal = (mealType: MealType = 'lunch', tab: FoodModalTab = 'database') => {
    setUnifiedMealType(mealType);
    setUnifiedInitialTab(tab);
    setIsUnifiedModalOpen(true);
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
          {/* Calorie Ring / Numbers in Gold & Amber */}
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
        </div>

        {/* 3 Macro Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-[#17284f]">
          {/* Protein */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-rose-400">Proteínas</span>
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

      {/* QUICK LOG CONTROL CENTER (Foto com IA, Descrever, Banco, Manual) */}
      <div className="bg-gradient-to-r from-[#0d1c3d] via-[#0b1836] to-[#0a152e] border border-amber-400/30 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <Zap className="w-4 h-4" />
              </span>
              Registrar Refeição & Calorias
            </h3>
            <p className="text-xs text-slate-300">
              Fotografe seu prato com IA, descreva em texto, busque no banco ou lance offline
            </p>
          </div>

          <button
            onClick={() => openAddFoodModal('lunch', 'database')}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            + Adicionar Alimento
          </button>
        </div>

        {/* 4 Direct Mode Action Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <button
            onClick={() => openAddFoodModal('lunch', 'camera')}
            className="p-3 rounded-2xl bg-[#08122a] hover:bg-[#10224d] border border-[#1a3160] hover:border-amber-400/50 flex flex-col items-center justify-center text-center gap-1.5 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">📸 Foto com IA</div>
            <div className="text-[10px] text-slate-400">Escaneie o prato</div>
          </button>

          <button
            onClick={() => openAddFoodModal('lunch', 'text')}
            className="p-3 rounded-2xl bg-[#08122a] hover:bg-[#10224d] border border-[#1a3160] hover:border-amber-400/50 flex flex-col items-center justify-center text-center gap-1.5 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">✍️ Descrever</div>
            <div className="text-[10px] text-slate-400">Em texto livre</div>
          </button>

          <button
            onClick={() => openAddFoodModal('lunch', 'database')}
            className="p-3 rounded-2xl bg-[#08122a] hover:bg-[#10224d] border border-[#1a3160] hover:border-amber-400/50 flex flex-col items-center justify-center text-center gap-1.5 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Database className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">📚 Banco de Dados</div>
            <div className="text-[10px] text-slate-400">Tabela com +70 itens</div>
          </button>

          <button
            onClick={() => openAddFoodModal('lunch', 'manual')}
            className="p-3 rounded-2xl bg-[#08122a] hover:bg-[#10224d] border border-[#1a3160] hover:border-amber-400/50 flex flex-col items-center justify-center text-center gap-1.5 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PenTool className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">✏️ Manual 4-4-9</div>
            <div className="text-[10px] text-slate-400">100% offline direto</div>
          </button>
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
                    onClick={() => openAddFoodModal(section.type, 'camera')}
                    className="p-2 rounded-xl bg-[#122247] hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 text-xs border border-[#17284f] transition-colors cursor-pointer"
                    title="Fotografar com IA"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                  </button>
                  <button
                    onClick={() => openAddFoodModal(section.type, 'database')}
                    className="p-2 rounded-xl bg-[#122247] hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 text-xs border border-[#17284f] transition-colors cursor-pointer"
                    title="Buscar na Tabela de Alimentos"
                  >
                    <Search className="w-4 h-4 text-amber-400" />
                  </button>
                  <button
                    onClick={() => openAddFoodModal(section.type, 'manual')}
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
                className="p-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 hover:from-amber-500 hover:to-yellow-500 hover:text-slate-950 font-bold text-[11px] transition-all cursor-pointer"
                title="Adicionar ao almoço"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* UNIFIED FOOD LOGGING MODAL (Foto IA, Descrever IA, Banco Offline, Manual 4-4-9) */}
      <UnifiedFoodModal
        isOpen={isUnifiedModalOpen}
        onClose={() => setIsUnifiedModalOpen(false)}
        onAddFood={onAddFood}
        defaultMealType={unifiedMealType}
        initialTab={unifiedInitialTab}
      />
    </div>
  );
};
