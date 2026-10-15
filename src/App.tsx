import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Square, ShieldAlert, Heart, 
  HelpCircle, CheckCircle2, AlertTriangle, ChevronRight, 
  ArrowLeft, Volume2, VolumeX, Info, Sparkles, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Screen = 'welcome' | 'check' | 'practice' | 'completion' | 'faq';

interface CycleInfo {
  cycleNum: number;
  phase: 'inhale' | 'exhale' | 'draw' | 'relax';
  instruction: string;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [hasPainOrDizziness, setHasPainOrDizziness] = useState<boolean | null>(null);
  
  // Timer state (0 to 300 seconds)
  const [secondsLeft, setSecondsLeft] = useState<number>(300);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'app' | 'faq'>('app');

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play gentle chime
  const playChime = (freq = 440) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.error(e);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isRunning && screen === 'practice' && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setScreen('completion');
            playChime(523.25); // C5
            return 0;
          }
          // Chime on milestone transitions
          const currentElapsed = 300 - (prev - 1);
          if (currentElapsed === 40 || currentElapsed === 90 || currentElapsed === 240) {
            playChime(392); // G4
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, screen, secondsLeft]);

  const elapsed = 300 - secondsLeft;

  // Determine current guidance based on time elapsed
  const getGuidance = () => {
    if (elapsed < 40) {
      return {
        title: "Acomodação e Respiração",
        desc: "Acomode-se. Solte os ombros e deixe a respiração acontecer sem forçar.",
        phase: "Preparação",
        progress: (elapsed / 40) * 100
      };
    } else if (elapsed < 90) {
      return {
        title: "Ritmo Natural",
        desc: "Inspire pelo nariz em um ritmo confortável. Ao expirar, deixe o abdômen relaxar. Não tente puxá-lo para dentro ainda.",
        phase: "Respiração Livre",
        progress: ((elapsed - 40) / 50) * 100
      };
    } else if (elapsed < 240) {
      // 6 cycles between 90s and 240s (150s total -> 25s per cycle)
      const cycleTime = elapsed - 90;
      const cycleDuration = 25;
      const cycleIndex = Math.min(Math.floor(cycleTime / cycleDuration), 5);
      const subTime = cycleTime % cycleDuration;
      
      let subPhase = "Inspiração";
      if (subTime > 12) subPhase = "Expiração e Contração Suave";

      return {
        title: `Ciclo ${cycleIndex + 1} de 6`,
        desc: "Expire suavemente e, no fim da expiração, aproxime a parte baixa do abdômen para dentro só um pouco. Mantenha a respiração fluindo. Depois inspire e relaxe.",
        phase: subPhase,
        progress: (cycleTime / 150) * 100,
        cycleNum: cycleIndex + 1
      };
    } else {
      return {
        title: "Retorno Gradual",
        desc: "Solte o abdômen. Respire normalmente e observe como se sente. Não mantenha a barriga contraída depois do exercício.",
        phase: "Relaxamento",
        progress: ((elapsed - 240) / 60) * 100
      };
    }
  };

  const currentGuidance = getGuidance();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartPractice = () => {
    setSecondsLeft(300);
    setIsRunning(true);
    setScreen('practice');
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(300);
  };

  const handlePauseToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleEnd = () => {
    setIsRunning(false);
    setScreen('completion');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-2 sm:p-6">
      {/* Mobile Device Frame wrapper */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[840px] border border-stone-200/80 relative">
        
        {/* Top Header */}
        <header className="px-6 py-4 bg-white border-b border-stone-100 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-semibold text-sm">
              BF
            </div>
            <div>
              <h1 className="text-sm font-bold text-stone-900 leading-tight">Guia Cintura Fina</h1>
              <p className="text-xs text-stone-500">Prática de 5 Minutos</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Desativar sons" : "Ativar sons de transição"}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button 
              onClick={() => setActiveTab(activeTab === 'app' ? 'faq' : 'app')}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1"
            >
              <HelpCircle size={14} />
              {activeTab === 'app' ? 'Dúvidas' : 'Prática'}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {activeTab === 'faq' ? (
            <div className="p-6 space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900">Perguntas Frequentes</h2>
                <button 
                  onClick={() => setActiveTab('app')}
                  className="text-sm text-teal-700 hover:underline font-medium"
                >
                  Voltar ao app
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-2">
                  <h3 className="font-semibold text-stone-900 text-sm">Preciso fazer em jejum ou ao acordar?</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    O app não precisa recomendar horário ou jejum. Escolha um momento confortável e siga o aviso de segurança.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-2">
                  <h3 className="font-semibold text-stone-900 text-sm">Tenho que prender a respiração?</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Não. Nesta versão, mantenha a respiração fluindo. Se não conseguir respirar confortavelmente, relaxe a contração. Fontes clínicas alertam que prender o ar pode causar tontura.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-2">
                  <h3 className="font-semibold text-stone-900 text-sm">Vou perder centímetros da cintura?</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Não há garantia. A prática pode ajudar a treinar o controle da contração abdominal, mas não deve ser divulgada como método de redução localizada de gordura ou de medidas.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-2">
                  <h3 className="font-semibold text-stone-900 text-sm">Posso fazer durante a gravidez ou no pós-parto?</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Esta versão não é personalizada para gravidez ou recuperação pós-parto. Converse com seu profissional de saúde antes de seguir práticas abdominais; a atividade apropriada pode depender da situação individual.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* TELA 1 — APRESENTAÇÃO */}
              {screen === 'welcome' && (
                <motion.div 
                  key="welcome"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-6 pt-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold">
                      <Sparkles size={13} />
                      Bônus Saúde & Bem-Estar
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
                        Prática abdominal guiada — 5 minutos
                      </h2>
                      <p className="text-sm font-medium text-teal-800">
                        Uma prática leve de respiração e controle abdominal — sem promessa de afinar a cintura.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 text-xs text-stone-600 leading-relaxed space-y-3">
                      <p>
                        O “vacuum abdominal” ou <em>abdominal drawing-in</em> é uma forma de contrair suavemente a parede abdominal e praticar o controle do tronco.
                      </p>
                      <p className="font-medium text-stone-700">
                        A evidência sobre a ativação muscular não comprova que o exercício reduza gordura localizada ou diminua a cintura. A contração muda temporariamente o contorno apenas enquanto é feita.
                      </p>
                    </div>

                    <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4 flex items-start gap-3">
                      <BookOpen size={20} className="text-teal-700 shrink-0 mt-0.5" />
                      <div className="text-xs text-teal-900 leading-relaxed">
                        <strong className="font-semibold block mb-0.5">Sem apneia e sem força máxima:</strong>
                        Esta versão prioriza o conforto, a coordenação respiratória suave e a ausência de dor ou tontura.
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 pb-2">
                    <button
                      onClick={() => setScreen('check')}
                      className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 group"
                    >
                      <span>Ler o aviso e iniciar</span>
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* TELA 2 — CHECAGEM RÁPIDA & AVISO */}
              {screen === 'check' && (
                <motion.div 
                  key="check"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-5">
                    <button 
                      onClick={() => setScreen('welcome')}
                      className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium"
                    >
                      <ArrowLeft size={14} /> Voltar
                    </button>

                    <h2 className="text-xl font-bold text-stone-900">Checagem rápida</h2>

                    {/* Question box */}
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                        <div>
                          <p className="text-sm font-bold text-amber-900">
                            Você sente dor, tontura ou desconforto abdominal agora?
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => setHasPainOrDizziness(true)}
                          className={`py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
                            hasPainOrDizziness === true 
                              ? 'bg-red-600 border-red-600 text-white shadow-sm' 
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setHasPainOrDizziness(false)}
                          className={`py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
                            hasPainOrDizziness === false 
                              ? 'bg-teal-700 border-teal-700 text-white shadow-sm' 
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    {/* Conditional warning if 'Sim' */}
                    {hasPainOrDizziness === true && (
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2 animate-fadeIn">
                        <p className="font-bold">Orientação importante:</p>
                        <p>
                          Como você relatou dor ou desconforto, não inicie a prática agora. Procure atendimento apropriado ou orientação de um profissional de saúde se necessário.
                        </p>
                      </div>
                    )}

                    {/* Full safety warning */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs text-stone-700 leading-relaxed max-h-[220px] overflow-y-auto">
                      <p className="font-bold text-stone-900 flex items-center gap-1.5">
                        <ShieldAlert size={15} className="text-stone-700" />
                        Aviso de Segurança Educativo
                      </p>
                      <p>
                        Esta prática não é tratamento, avaliação física nem orientação individualizada. Não promete afinar a cintura, reduzir gordura, tratar diástase ou substituir acompanhamento profissional.
                      </p>
                      <p>
                        Faça o movimento de forma leve, sem dor e respirando. Pare se sentir tontura, falta de ar, dor, pressão ou mal-estar. Se você está grávida ou no pós-parto, tem hérnia, passou recentemente por cirurgia abdominal ou pélvica, possui pressão alta não controlada, apresenta sintomas no assoalho pélvico ou não sabe se a prática é adequada, converse com um profissional de saúde.
                      </p>
                      <p className="font-semibold text-stone-900">
                        Não faça a prática como desafio de prender o ar ou “sugar” a barriga ao máximo.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      disabled={hasPainOrDizziness !== false}
                      onClick={handleStartPractice}
                      className={`w-full py-3.5 px-4 font-semibold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                        hasPainOrDizziness === false
                          ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Iniciar prática guiada</span>
                      <ChevronRight size={18} />
                    </button>
                    {hasPainOrDizziness === null && (
                      <p className="text-[11px] text-center text-stone-400 mt-2">
                        Responda à pergunta acima para habilitar o botão.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TELA 3 — PRÁTICA */}
              {screen === 'practice' && (
                <motion.div 
                  key="practice"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 flex-1 flex flex-col justify-between text-center"
                >
                  <div className="space-y-4">
                    {/* Top status */}
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span className="font-medium bg-stone-100 px-3 py-1 rounded-full">
                        {currentGuidance.phase}
                      </span>
                      <span className="font-mono text-sm font-bold text-stone-800">
                        {formatTime(secondsLeft)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-teal-600 h-full transition-all duration-500 ease-out"
                        style={{ width: `${((300 - secondsLeft) / 300) * 100}%` }}
                      />
                    </div>

                    {/* Breathing visualizer circle */}
                    <div className="py-6 flex items-center justify-center">
                      <div className="relative w-48 h-48 rounded-full bg-teal-50/80 border border-teal-100 flex items-center justify-center shadow-inner">
                        <motion.div 
                          animate={{ 
                            scale: currentGuidance.phase.includes('Expiração') || currentGuidance.phase.includes('Relaxamento') ? [1, 0.92, 1] : [1, 1.08, 1],
                            opacity: [0.7, 1, 0.7]
                          }}
                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                          className="absolute w-36 h-36 rounded-full bg-teal-200/50 flex items-center justify-center"
                        />
                        <div className="relative z-10 text-center px-4">
                          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block mb-1">
                            {currentGuidance.title}
                          </span>
                          <span className="text-2xl font-mono font-bold text-stone-900">
                            {formatTime(secondsLeft)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Instruction text card */}
                    <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                      <p className="text-sm font-semibold text-stone-900 leading-relaxed">
                        {currentGuidance.desc}
                      </p>
                    </div>

                    {/* Always visible safety banner */}
                    <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-xs text-teal-900 font-medium flex items-center justify-center gap-2">
                      <Heart size={15} className="text-teal-700 shrink-0" />
                      <span>Continue respirando; solte se houver desconforto.</span>
                    </div>
                  </div>

                  {/* Practice controls */}
                  <div className="pt-6 space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={handlePauseToggle}
                        className="flex-1 py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        {isRunning ? <Pause size={18} /> : <Play size={18} />}
                        <span>{isRunning ? 'Pausar' : 'Continuar'}</span>
                      </button>

                      <button
                        onClick={handleReset}
                        title="Reiniciar prática"
                        className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-2xl transition-all"
                      >
                        <RotateCcw size={18} />
                      </button>
                    </div>

                    <button
                      onClick={handleEnd}
                      className="w-full py-2.5 text-xs text-stone-500 hover:text-stone-800 font-medium transition-colors"
                    >
                      Encerrar prática agora
                    </button>
                  </div>
                </motion.div>
              )}

              {/* TELA 4 — ENCERRAMENTO */}
              {screen === 'completion' && (
                <motion.div 
                  key="completion"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-6 pt-2">
                    <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 size={28} />
                    </div>

                    <div className="text-center space-y-2">
                      <h2 className="text-xl font-bold text-stone-900">Prática concluída</h2>
                      <p className="text-xs text-stone-600 leading-relaxed px-2">
                        “Prática concluída. Seu abdômen pode relaxar; não é necessário mantê-lo contraído.”
                      </p>
                    </div>

                    {/* Optional feedback question */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                      <p className="text-xs font-bold text-stone-900 text-center">
                        Como foi?
                      </p>

                      <div className="space-y-2">
                        {[
                          { id: 'comfortable', label: 'Confortável' },
                          { id: 'difficult', label: 'Difícil de coordenar' },
                          { id: 'discomfort', label: 'Senti desconforto' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setFeedback(item.id)}
                            className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                              feedback === item.id
                                ? 'bg-teal-700 border-teal-700 text-white shadow-sm'
                                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <span>{item.label}</span>
                            {feedback === item.id && <CheckCircle2 size={16} />}
                          </button>
                        ))}
                      </div>

                      {feedback === 'discomfort' && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1 animate-fadeIn">
                          <p className="font-bold">Recomendação:</p>
                          <p>
                            Se você sentiu desconforto, recomendamos não repetir a prática até buscar orientação adequada, sem sugerir aumentar o esforço ou insistir.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => {
                        setScreen('welcome');
                        setFeedback(null);
                        setHasPainOrDizziness(null);
                      }}
                      className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} />
                      <span>Voltar ao início</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>

        {/* Footer subtle note */}
        <footer className="px-6 py-3 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-400 text-center">
          Guia Cintura Fina • Saúde, respiração e consciência corporal
        </footer>

      </div>
    </div>
  );
}
