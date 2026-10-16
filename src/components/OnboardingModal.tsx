import React, { useState } from 'react';
import {
  Gender,
  ActivityLevel,
  UserProfile,
} from '../types/fitness';
import {
  calculateCompleteProfile,
  ACTIVITY_LABELS,
} from '../utils/fitnessMath';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
  User,
  Scale,
  Ruler,
  Calendar,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
  onClose?: () => void;
  initialProfile?: UserProfile;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  onClose,
  initialProfile,
}) => {
  const [step, setStep] = useState<number>(1);

  // Form states - basic physical characteristics only
  const [name, setName] = useState(
    initialProfile?.name && initialProfile.name !== 'Meu Perfil' ? initialProfile.name : ''
  );
  const [gender, setGender] = useState<Gender>(initialProfile?.gender || 'male');
  const [age, setAge] = useState<string>(
    initialProfile?.age ? String(initialProfile.age) : '25'
  );
  const [height, setHeight] = useState<string>(
    initialProfile?.height ? String(initialProfile.height) : '175'
  );
  const [currentWeight, setCurrentWeight] = useState<string>(
    initialProfile?.currentWeight ? String(initialProfile.currentWeight) : '75.0'
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile?.activityLevel || 'moderate'
  );

  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setName(initialProfile?.name && initialProfile.name !== 'Meu Perfil' ? initialProfile.name : '');
      setGender(initialProfile?.gender || 'male');
      setAge(initialProfile?.age ? String(initialProfile.age) : '25');
      setHeight(initialProfile?.height ? String(initialProfile.height) : '175');
      setCurrentWeight(initialProfile?.currentWeight ? String(initialProfile.currentWeight) : '75.0');
      setActivityLevel(initialProfile?.activityLevel || 'moderate');
    }
  }, [isOpen, initialProfile]);

  if (!isOpen) return null;

  const handleFinish = () => {
    const parsedWeight = parseFloat(currentWeight.replace(',', '.')) || 70;
    const parsedHeight = parseInt(height, 10) || 170;
    const parsedAge = parseInt(age, 10) || 25;

    const profile = calculateCompleteProfile({
      name: name.trim() || 'Meu Perfil',
      gender,
      age: Math.max(14, Math.min(100, parsedAge)),
      height: Math.max(100, Math.min(250, parsedHeight)),
      currentWeight: Math.max(30, Math.min(300, parsedWeight)),
      activityLevel,
      goal: initialProfile?.goal || 'none',
      goalIntensity: initialProfile?.goalIntensity || 'moderate',
      hasActiveGoal: initialProfile?.hasActiveGoal || false,
      targetDays: initialProfile?.targetDays || 60,
    });

    onComplete(profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060f]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0a142c] border border-[#1a2d56] rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Top Progress bar */}
        <div className="h-1.5 w-full bg-[#060c19]">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#17284f] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                Passo {step} de 2
              </span>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                {step === 1 ? 'Cadastro Inicial: Características Básicas' : 'Nível de Atividade Física'}
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {step === 1
                ? 'Informe peso, altura e idade. Essa pesagem será sua referência inicial de evolução.'
                : 'Selecione sua frequência de treinos e movimento semanal para calibrar o gasto calórico.'}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-[#1a2d56] bg-[#060c19]"
            >
              Pular / Fechar
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Seu Nome ou Apelido
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos, Ana, Lucas..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#060c19] border border-[#17284f] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Gênero Biológico (para cálculo basal preciso)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center font-medium transition-all ${
                      gender === 'male'
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'bg-[#060c19] border-[#17284f] text-slate-300 hover:bg-[#122247]'
                    }`}
                  >
                    Masculino
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center font-medium transition-all ${
                      gender === 'female'
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'bg-[#060c19] border-[#17284f] text-slate-300 hover:bg-[#122247]'
                    }`}
                  >
                    Feminino
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Idade
                  </label>
                  <input
                    type="number"
                    min="14"
                    max="100"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3.5 py-3 bg-[#060c19] border border-[#17284f] rounded-xl text-white focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">anos</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5 text-amber-400" /> Altura
                  </label>
                  <input
                    type="number"
                    min="120"
                    max="230"
                    placeholder="175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-3.5 py-3 bg-[#060c19] border border-[#17284f] rounded-xl text-white focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">cm</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-amber-400" /> Peso Atual
                  </label>
                  <input
                    type="text"
                    placeholder="75.0"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    className="w-full px-3.5 py-3 bg-[#060c19] border-2 border-amber-400/60 rounded-xl text-white focus:outline-none focus:border-amber-400 font-mono font-black text-base"
                  />
                  <span className="text-[10px] text-amber-400 font-semibold block mt-1">kg (Referência)</span>
                </div>
              </div>

              <div className="p-4 bg-[#060c19] border border-[#17284f] rounded-2xl text-xs text-slate-300 leading-relaxed">
                <span className="text-amber-400 font-bold block mb-1">
                  ✓ Pesagem Inicial de Referência
                </span>
                O peso informado acima será gravado como sua pesagem inicial de referência na aba de <strong className="text-white">Evolução & Metas</strong>, com a data de hoje. Você poderá adicionar novas pesagens e acompanhar o progresso real em gráficos!
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => {
                const info = ACTIVITY_LABELS[level];
                const isSelected = activityLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setActivityLevel(level)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 text-white shadow-md'
                        : 'bg-[#060c19] border-[#17284f] text-slate-300 hover:bg-[#122247]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border shrink-0 ${
                        isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white">{info.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{info.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#17284f] bg-[#081022] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl border border-[#a16207]/40 bg-[#122247] hover:bg-[#182f61] text-amber-200 flex items-center gap-1.5 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              Próximo: Nível de Atividade <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-amber-500/25 transition-all"
            >
              Concluir Cadastro & Entrar no App <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
