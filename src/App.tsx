import { useState, useEffect } from 'react';
import { 
  Play, Trophy, Clock, CheckCircle2, XCircle, 
  HelpCircle, ChevronRight, Volume2, BookOpen, Target, Star,
  BarChart3, Home, SkipForward, Brain, Languages, Sparkles,
  GraduationCap, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  vocabularyByLevel,
  type VocabularyItem, 
  type QuizMode, 
  type QuizSettings, 
  type QuizResult,
  type HSKLevel 
} from '@/data/vocabulary';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

type AppState = 'home' | 'select-level' | 'setup' | 'quiz' | 'result' | 'review' | 'stats';

const quizModes: { id: QuizMode; name: string; description: string; icon: React.ElementType }[] = [
  { id: 'chinese-to-english', name: 'Chinese → English', description: 'See Chinese, choose English meaning', icon: Languages },
  { id: 'english-to-chinese', name: 'English → Chinese', description: 'See English, choose Chinese character', icon: BookOpen },
  { id: 'pinyin-to-chinese', name: 'Pinyin → Chinese', description: 'See Pinyin, choose Chinese character', icon: Volume2 },
  { id: 'chinese-to-pinyin', name: 'Chinese → Pinyin', description: 'See Chinese, choose correct Pinyin', icon: Target },
  { id: 'mixed', name: 'Mixed Mode', description: 'Random mix of all quiz types', icon: Sparkles },
];

const questionCountOptions = [10, 20, 30, 50, 100];

const hskLevels: { level: HSKLevel; name: string; description: string; count: number; color: string }[] = [
  { level: 1, name: 'HSK Level 1', description: 'Beginner - Essential daily words', count: 300, color: 'from-green-400 to-emerald-600' },
  { level: 3, name: 'HSK Level 3', description: 'Intermediate - Expanded vocabulary', count: 300, color: 'from-indigo-400 to-purple-600' },
  { level: 4, name: 'HSK Level 4', description: 'Advanced - Professional vocabulary', count: 600, color: 'from-orange-400 to-red-600' },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateOptions(correctItem: VocabularyItem, allItems: VocabularyItem[], mode: QuizMode): string[] {
  const options = new Set<string>();
  
  let correctAnswer: string;
  switch (mode) {
    case 'chinese-to-english':
      correctAnswer = correctItem.english;
      break;
    case 'english-to-chinese':
      correctAnswer = correctItem.chinese;
      break;
    case 'pinyin-to-chinese':
      correctAnswer = correctItem.chinese;
      break;
    case 'chinese-to-pinyin':
      correctAnswer = correctItem.pinyin;
      break;
    default:
      correctAnswer = correctItem.english;
  }
  
  options.add(correctAnswer);
  
  while (options.size < 4) {
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    let option: string;
    switch (mode) {
      case 'chinese-to-english':
        option = randomItem.english;
        break;
      case 'english-to-chinese':
        option = randomItem.chinese;
        break;
      case 'pinyin-to-chinese':
        option = randomItem.chinese;
        break;
      case 'chinese-to-pinyin':
        option = randomItem.pinyin;
        break;
      default:
        option = randomItem.english;
    }
    if (option !== correctAnswer) {
      options.add(option);
    }
  }
  
  return shuffleArray(Array.from(options));
}

function getQuestionText(item: VocabularyItem, mode: QuizMode): string {
  switch (mode) {
    case 'chinese-to-english':
      return item.chinese;
    case 'english-to-chinese':
      return item.english;
    case 'pinyin-to-chinese':
      return item.pinyin;
    case 'chinese-to-pinyin':
      return item.chinese;
    default:
      return item.chinese;
  }
}

function getCorrectAnswer(item: VocabularyItem, mode: QuizMode): string {
  switch (mode) {
    case 'chinese-to-english':
      return item.english;
    case 'english-to-chinese':
      return item.chinese;
    case 'pinyin-to-chinese':
      return item.chinese;
    case 'chinese-to-pinyin':
      return item.pinyin;
    default:
      return item.english;
  }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({
    level: 1,
    mode: 'chinese-to-english',
    questionCount: 20,
    timeLimit: null,
    showPinyin: true,
  });
  
  const [quizQuestions, setQuizQuestions] = useState<VocabularyItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizResult['answers']>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Stats
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [levelStats, setLevelStats] = useState<Record<HSKLevel, { quizzes: number; correct: number; total: number }>>({
    1: { quizzes: 0, correct: 0, total: 0 },
    3: { quizzes: 0, correct: 0, total: 0 },
    4: { quizzes: 0, correct: 0, total: 0 },
  });

  useEffect(() => {
    const savedStats = localStorage.getItem('hsk-quiz-stats');
    if (savedStats) {
      const stats = JSON.parse(savedStats);
      setTotalQuizzes(stats.totalQuizzes || 0);
      setTotalCorrect(stats.totalCorrect || 0);
      setTotalQuestions(stats.totalQuestions || 0);
      setBestScore(stats.bestScore || 0);
      setLevelStats(stats.levelStats || { 1: { quizzes: 0, correct: 0, total: 0 }, 3: { quizzes: 0, correct: 0, total: 0 }, 4: { quizzes: 0, correct: 0, total: 0 } });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hsk-quiz-stats', JSON.stringify({
      totalQuizzes,
      totalCorrect,
      totalQuestions,
      bestScore,
      levelStats,
    }));
  }, [totalQuizzes, totalCorrect, totalQuestions, bestScore, levelStats]);

  useEffect(() => {
    if (quizSettings.timeLimit && appState === 'quiz' && timeLeft !== null) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            finishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizSettings.timeLimit, appState, timeLeft]);

  const startQuiz = () => {
    const vocabulary = vocabularyByLevel[quizSettings.level];
    const shuffled = shuffleArray(vocabulary);
    const selected = shuffled.slice(0, quizSettings.questionCount);
    setQuizQuestions(selected);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswers([]);
    setStartTime(Date.now());
    setTimeLeft(quizSettings.timeLimit);
    
    const currentMode = quizSettings.mode === 'mixed' 
      ? quizModes[Math.floor(Math.random() * 4)].id 
      : quizSettings.mode;
    setOptions(generateOptions(selected[0], vocabulary, currentMode));
    
    setAppState('quiz');
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const currentMode = quizSettings.mode === 'mixed'
      ? quizModes[Math.floor(Math.random() * 4)].id
      : quizSettings.mode;
    const correct = answer === getCorrectAnswer(currentQuestion, currentMode);
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    if (correct) {
      setScore(score + 1);
      setStreak(streak + 1);
      if (streak + 1 > bestStreak) {
        setBestStreak(streak + 1);
      }
    } else {
      setStreak(0);
    }
    
    setAnswers([...answers, {
      question: currentQuestion,
      userAnswer: answer,
      correct,
      options,
    }]);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowHint(false);
      
      const vocabulary = vocabularyByLevel[quizSettings.level];
      const currentMode = quizSettings.mode === 'mixed'
        ? quizModes[Math.floor(Math.random() * 4)].id
        : quizSettings.mode;
      setOptions(generateOptions(quizQuestions[nextIndex], vocabulary, currentMode));
    } else {
      finishQuiz();
    }
  };

  const skipQuestion = () => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    
    setAnswers([...answers, {
      question: currentQuestion,
      userAnswer: 'Skipped',
      correct: false,
      options,
    }]);
    setStreak(0);
    nextQuestion();
  };

  const finishQuiz = () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const correct = answers.filter(a => a.correct).length;
    const skipped = answers.filter(a => a.userAnswer === 'Skipped').length;
    
    const result: QuizResult = {
      level: quizSettings.level,
      correct,
      incorrect: answers.length - correct,
      skipped,
      timeTaken,
      answers,
    };
    
    setQuizResult(result);
    setTotalQuizzes(prev => prev + 1);
    setTotalCorrect(prev => prev + correct);
    setTotalQuestions(prev => prev + answers.length);
    
    // Update level stats
    setLevelStats(prev => ({
      ...prev,
      [quizSettings.level]: {
        quizzes: prev[quizSettings.level].quizzes + 1,
        correct: prev[quizSettings.level].correct + correct,
        total: prev[quizSettings.level].total + answers.length,
      }
    }));
    
    const percentage = Math.round((correct / answers.length) * 100);
    if (percentage > bestScore) {
      setBestScore(percentage);
    }
    
    if (percentage >= 80) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    
    setAppState('result');
  };

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const currentMode = quizSettings.mode === 'mixed'
    ? quizModes[Math.floor(Math.random() * 4)].id
    : quizSettings.mode;
  const progress = quizQuestions.length > 0 ? ((currentQuestionIndex + (isAnswered ? 1 : 0)) / quizQuestions.length) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Home Screen
  if (appState === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Modern Navigation */}
          <motion.header 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex justify-between items-center mb-16"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-800">HSK Quiz</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={() => setAppState('stats')}
                className="text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setAppState('select-level')}
                className="text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-colors"
              >
                <Play className="w-4 h-4 mr-2" />
                Quiz
              </Button>
            </nav>
          </motion.header>

          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 100 }}
              className="inline-block mb-8"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
            </motion.div>
            
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-6 leading-tight">
              Master Chinese
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Vocabulary</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed">
              Elevate your HSK exam preparation with our intelligent quiz platform. Practice vocabulary across multiple levels with real-time feedback and progress tracking.
            </p>

            {/* Quick Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-6 md:gap-12 mb-12"
            >
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-800">{totalQuizzes}</p>
                <p className="text-slate-500">Quizzes Completed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-800">{totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0}%</p>
                <p className="text-slate-500">Overall Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-800">{bestScore}%</p>
                <p className="text-slate-500">Best Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-800">1,200+</p>
                <p className="text-slate-500">Vocabulary Words</p>
              </div>
            </motion.div>
          </motion.section>

          {/* Primary Actions */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-20"
          >
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <motion.div whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={() => setAppState('select-level')}
                  className="w-full h-28 text-xl bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center">
                    <Play className="w-7 h-7 mr-4 group-hover:translate-x-1 transition-transform" />
                    <span className="text-left">
                      <span className="block font-semibold">Start New Quiz</span>
                      <span className="text-sm opacity-90">Choose your level & begin</span>
                    </span>
                  </div>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={() => setAppState('stats')}
                  variant="outline"
                  className="w-full h-28 text-xl border-2 border-slate-300 bg-white/50 hover:bg-white hover:border-slate-400 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 mr-4 group-hover:scale-110 transition-transform" />
                    <span className="text-left">
                      <span className="block font-semibold">View Progress</span>
                      <span className="text-sm opacity-70">Analyze your performance</span>
                    </span>
                  </div>
                </Button>
              </motion.div>
            </div>
          </motion.section>

          {/* Features Section */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">Why Choose HSK Quiz?</h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">Everything you need to master Chinese vocabulary efficiently</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Layers,
                  title: "Comprehensive HSK Levels",
                  description: "Practice with authentic Level 1, 3, and 4 vocabulary aligned with official HSK standards.",
                  color: "blue",
                  gradient: "from-blue-500 to-blue-600"
                },
                {
                  icon: Brain,
                  title: "Smart Quiz Modes",
                  description: "Multiple learning modes: Chinese→English, English→Chinese, Pinyin practice, and adaptive mixed modes.",
                  color: "green",
                  gradient: "from-green-500 to-green-600"
                },
                {
                  icon: Sparkles,
                  title: "Modern Learning Experience",
                  description: "Beautiful interface with smooth animations, instant feedback, and detailed progress analytics.",
                  color: "indigo",
                  gradient: "from-indigo-500 to-indigo-600"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className={`absolute -top-6 left-8 w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="pt-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                  
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Mobile Navigation Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="md:hidden mt-20 pt-8 border-t border-slate-200"
          >
            <div className="flex justify-around">
              <Button 
                onClick={() => setAppState('select-level')}
                className="flex-1 mx-2 bg-blue-500 hover:bg-blue-600"
              >
                <Play className="w-5 h-5 mr-2" />
                Quiz
              </Button>
              <Button 
                onClick={() => setAppState('stats')}
                variant="outline"
                className="flex-1 mx-2"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Stats
              </Button>
            </div>
          </motion.footer>
        </div>
      </div>
    );
  }

  // Select Level Screen
  if (appState === 'select-level') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <Button variant="ghost" onClick={() => setAppState('home')}>
                <Home className="w-5 h-5 mr-2" />
                Back
              </Button>
              <h2 className="text-2xl font-bold text-gray-800">Select HSK Level</h2>
              <div className="w-20" />
            </div>

            <div className="grid gap-4">
              {hskLevels.map((level, index) => (
                <motion.button
                  key={level.level}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    setQuizSettings({ ...quizSettings, level: level.level });
                    setAppState('setup');
                  }}
                  className="relative overflow-hidden p-6 rounded-2xl border-2 border-gray-200 hover:border-transparent transition-all group"
                >
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity",
                    level.color
                  )} />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-white transition-colors">
                        {level.name}
                      </h3>
                      <p className="text-gray-500 group-hover:text-white/80 transition-colors">
                        {level.description}
                      </p>
                      <p className="text-sm text-gray-400 group-hover:text-white/60 transition-colors mt-1">
                        {level.count} words
                      </p>
                    </div>
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center",
                      "bg-gradient-to-r",
                      level.color
                    )}>
                      <span className="text-2xl font-bold text-white">{level.level}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

          {/* Level Stats Preview */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-600 mb-1">Level 1 Progress</p>
              <p className="text-2xl font-bold text-green-700">
                {levelStats[1].total > 0 ? Math.round((levelStats[1].correct / levelStats[1].total) * 100) : 0}%
              </p>
              <p className="text-xs text-green-500">{levelStats[1].quizzes} quizzes</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-sm text-purple-600 mb-1">Level 3 Progress</p>
              <p className="text-2xl font-bold text-purple-700">
                {levelStats[3].total > 0 ? Math.round((levelStats[3].correct / levelStats[3].total) * 100) : 0}%
              </p>
              <p className="text-xs text-purple-500">{levelStats[3].quizzes} quizzes</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl">
              <p className="text-sm text-orange-600 mb-1">Level 4 Progress</p>
              <p className="text-2xl font-bold text-orange-700">
                {levelStats[4].total > 0 ? Math.round((levelStats[4].correct / levelStats[4].total) * 100) : 0}%
              </p>
              <p className="text-xs text-orange-500">{levelStats[4].quizzes} quizzes</p>
            </div>
          </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Setup Screen
  if (appState === 'setup') {
    const selectedLevel = hskLevels.find(l => l.level === quizSettings.level);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-blue-500/10 border border-white/20 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Button 
                  variant="ghost" 
                  onClick={() => setAppState('select-level')}
                  className="absolute top-6 left-6 text-white hover:bg-white/20 rounded-full p-3"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </Button>
                
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-2">Quiz Configuration</h1>
                  <p className="text-blue-100">Customize your learning experience</p>
                </div>
                
                <div className="text-center mt-6">
                  <Badge className={cn(
                    "bg-white/20 text-white border-white/30 text-lg px-6 py-2"
                  )}>
                    {selectedLevel?.name}
                  </Badge>
                </div>
              </motion.div>
            </div>

            <div className="p-8 md:p-12">
              <div className="space-y-10">
                {/* Quiz Mode Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-blue-600" />
                    </div>
                    Quiz Mode
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {quizModes.map((mode, index) => (
                      <motion.button
                        key={mode.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                        onClick={() => setQuizSettings({ ...quizSettings, mode: mode.id })}
                        className={cn(
                          "group relative p-6 rounded-2xl border-2 text-left transition-all duration-300",
                          quizSettings.mode === mode.id
                            ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                        )}
                      >
                        {quizSettings.mode === mode.id && (
                          <motion.div
                            layoutId="activeModeIndicator"
                            className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                        
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                            quizSettings.mode === mode.id
                              ? "bg-blue-500 text-white"
                              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                          )}>
                            <mode.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className={cn(
                              "font-semibold text-lg mb-1",
                              quizSettings.mode === mode.id ? "text-blue-900" : "text-slate-800"
                            )}>
                              {mode.name}
                            </h3>
                            <p className={cn(
                              "text-sm leading-relaxed",
                              quizSettings.mode === mode.id ? "text-blue-700" : "text-slate-500"
                            )}>
                              {mode.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.section>

                {/* Question Count Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    Number of Questions
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {questionCountOptions.map((count, index) => (
                      <motion.button
                        key={count}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                        onClick={() => setQuizSettings({ ...quizSettings, questionCount: count })}
                        className={cn(
                          "relative px-4 py-4 rounded-xl border-2 font-semibold transition-all duration-300",
                          "focus:outline-none focus:ring-4 focus:ring-blue-500/20",
                          quizSettings.questionCount === count
                            ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:-translate-y-1"
                        )}
                      >
                        {quizSettings.questionCount === count && (
                          <motion.div
                            layoutId="activeCountIndicator"
                            className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                        <span className="text-lg">{count}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.section>

                {/* Time Limit Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    Time Limit (Optional)
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {[null, 5, 10, 15].map((minutes, index) => (
                      <motion.button
                        key={minutes || 'no-limit'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                        onClick={() => setQuizSettings({ 
                          ...quizSettings, 
                          timeLimit: minutes ? minutes * 60 : null 
                        })}
                        className={cn(
                          "px-6 py-3 rounded-xl border-2 font-semibold transition-all duration-300",
                          "focus:outline-none focus:ring-4 focus:ring-purple-500/20",
                          quizSettings.timeLimit === (minutes ? minutes * 60 : null)
                            ? "border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                            : "border-slate-200 bg-white text-slate-700 hover:border-purple-400 hover:bg-purple-50 hover:-translate-y-1"
                        )}
                      >
                        {minutes ? `${minutes} min` : 'No Limit'}
                      </motion.button>
                    ))}
                  </div>
                </motion.section>

                {/* Show Pinyin Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                >
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-orange-600" />
                    </div>
                    Learning Preferences
                  </h2>
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                          <HelpCircle className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <span className="text-lg font-semibold text-slate-800">Show Pinyin hints</span>
                          <p className="text-slate-500">Display pronunciation guides for Chinese characters</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={quizSettings.showPinyin}
                          onChange={(e) => setQuizSettings({ ...quizSettings, showPinyin: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-8 bg-slate-200 rounded-full peer peer-checked:bg-orange-500 transition-colors duration-300" />
                        <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform peer-checked:translate-x-6 transition-transform duration-300" />
                      </div>
                    </label>
                  </div>
                </motion.section>
              </div>

              {/* Start Quiz Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="mt-12 pt-8 border-t border-slate-200"
              >
                <Button 
                  onClick={startQuiz}
                  className="w-full h-16 text-xl bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.02] group"
                >
                  <div className="flex items-center justify-center">
                    <Play className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform" />
                    <span className="font-semibold">Begin Your Quiz Journey</span>
                  </div>
                </Button>
                <p className="text-center text-slate-500 mt-4 text-sm">Ready to test your Chinese vocabulary skills?</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Quiz Screen
  if (appState === 'quiz' && currentQuestion) {
    const questionText = getQuestionText(currentQuestion, currentMode);
    const correctAnswer = getCorrectAnswer(currentQuestion, currentMode);
    const selectedLevel = hskLevels.find(l => l.level === quizSettings.level);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-4">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Progress Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Badge className={cn(
                  "text-white bg-gradient-to-r",
                  selectedLevel?.color
                )}>
                  HSK {quizSettings.level}
                </Badge>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {currentQuestionIndex + 1} / {quizQuestions.length}
                </Badge>
                {timeLeft !== null && (
                  <Badge variant="outline" className={cn(
                    "text-lg px-4 py-2",
                    timeLeft < 60 && "text-red-600 border-red-300 bg-red-50"
                  )}>
                    <Clock className="w-4 h-4 mr-2 inline" />
                    {formatTime(timeLeft)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  <Trophy className="w-4 h-4 mr-2 inline text-yellow-500" />
                  {score}
                </Badge>
                {streak > 2 && (
                  <Badge className="bg-orange-500 text-white text-lg px-4 py-2">
                    <Sparkles className="w-4 h-4 mr-2 inline" />
                    {streak}x
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progress} className="h-3" />
          </motion.div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white shadow-xl border-0 mb-6">
                <CardContent className="p-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-4 uppercase tracking-wide">
                      {currentMode === 'chinese-to-english' && 'What does this mean?'}
                      {currentMode === 'english-to-chinese' && 'Choose the Chinese character'}
                      {currentMode === 'pinyin-to-chinese' && 'Choose the Chinese character'}
                      {currentMode === 'chinese-to-pinyin' && 'What is the Pinyin?'}
                    </p>
                    
                    <h2 className={cn(
                      "font-bold mb-4",
                      currentMode === 'english-to-chinese' || currentMode === 'pinyin-to-chinese' 
                        ? "text-3xl text-gray-800" 
                        : "text-5xl text-indigo-600"
                    )}>
                      {questionText}
                    </h2>
                    
                    {quizSettings.showPinyin && currentMode !== 'pinyin-to-chinese' && currentMode !== 'chinese-to-pinyin' && (
                      <p className="text-xl text-gray-400">{currentQuestion.pinyin}</p>
                    )}
                    
                    {currentMode === 'chinese-to-pinyin' && quizSettings.showPinyin && showHint && (
                      <p className="text-lg text-gray-400 mt-2">Meaning: {currentQuestion.english}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Hint Button */}
              {currentMode === 'chinese-to-pinyin' && quizSettings.showPinyin && !isAnswered && !showHint && (
                <div className="text-center mb-4">
                  <Button variant="ghost" onClick={() => setShowHint(true)} className="text-gray-500">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Show Hint
                  </Button>
                </div>
              )}

              {/* Options */}
              <div className="grid gap-3">
                {options.map((option, index) => {
                  const isCorrect = option === correctAnswer;
                  const isSelected = selectedAnswer === option;
                  
                  return (
                    <motion.button
                      key={option}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                      onClick={() => handleAnswer(option)}
                      disabled={isAnswered}
                      className={cn(
                        "p-5 rounded-xl border-2 text-left transition-all duration-300 transform",
                        "focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-opacity-50",
                        !isAnswered && [
                          "hover:border-indigo-400 hover:bg-indigo-50 hover:scale-105 hover:shadow-lg",
                          "active:scale-95 active:bg-indigo-100"
                        ],
                        isAnswered && isCorrect && "border-green-500 bg-green-50 scale-105 shadow-lg",
                        isAnswered && isSelected && !isCorrect && "border-red-500 bg-red-50 scale-105 shadow-lg",
                        isAnswered && !isSelected && !isCorrect && "border-gray-200 opacity-60",
                        "disabled:cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-lg font-medium leading-relaxed",
                          !isAnswered && "text-gray-800",
                          isAnswered && isCorrect && "text-green-800 font-semibold",
                          isAnswered && isSelected && !isCorrect && "text-red-800 font-semibold",
                          isAnswered && !isSelected && !isCorrect && "text-gray-500"
                        )}>
                          {option} 
                        </span>
                        {isAnswered && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
                          >
                            {isCorrect ? (
                              <CheckCircle2 className="w-6 h-6 text-green-500" />
                            ) : (
                              isSelected && <XCircle className="w-6 h-6 text-red-500" />
                            )}
                          </motion.div>
                        )}
                      </div>
                      {isAnswered && isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 pt-3 border-t border-current border-opacity-20"
                        >
                          <p className={cn(
                            "text-sm",
                            isCorrect ? "text-green-700" : "text-red-700"
                          )}>
                            {isCorrect ? "✓ Correct answer!" : "✗ Incorrect answer"}
                          </p>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex gap-3"
                >
                  <Button 
                    onClick={nextQuestion}
                    className="flex-1 h-14 text-lg bg-gradient-to-r from-indigo-500 to-purple-600"
                  >
                    {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}
              
              {!isAnswered && (
                <div className="mt-6 flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={skipQuestion}
                    className="flex-1 h-12"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Result Screen
  if (appState === 'result' && quizResult) {
    const percentage = Math.round((quizResult.correct / quizResult.answers.length) * 100);
    const isExcellent = percentage >= 90;
    const isGood = percentage >= 70;
    const selectedLevel = hskLevels.find(l => l.level === quizResult.level);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            {/* Level Badge */}
            <div className="text-center mb-4">
              <Badge className={cn(
                "text-white text-lg px-4 py-1 bg-gradient-to-r",
                selectedLevel?.color
              )}>
                {selectedLevel?.name}
              </Badge>
            </div>

            {/* Score Display */}
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6",
                  isExcellent ? "bg-gradient-to-br from-green-400 to-green-600" :
                  isGood ? "bg-gradient-to-br from-blue-400 to-blue-600" :
                  "bg-gradient-to-br from-orange-400 to-orange-600"
                )}
              >
                <span className="text-4xl font-bold text-white">{percentage}%</span>
              </motion.div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {isExcellent ? 'Excellent! 🎉' : isGood ? 'Great Job! 👍' : 'Keep Practicing! 💪'}
              </h2>
              <p className="text-gray-500">
                You got {quizResult.correct} out of {quizResult.answers.length} correct
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{quizResult.correct}</p>
                <p className="text-sm text-green-600">Correct</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-700">{quizResult.incorrect}</p>
                <p className="text-sm text-red-600">Incorrect</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">{formatTime(quizResult.timeTaken)}</p>
                <p className="text-sm text-blue-600">Time</p>
              </div>
            </div>

            {/* Best Streak */}
            {bestStreak > 2 && (
              <div className="text-center mb-8 p-4 bg-orange-50 rounded-xl">
                <Sparkles className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-xl font-bold text-orange-700">Best Streak: {bestStreak}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => setAppState('review')}
                variant="outline"
                className="w-full h-14 text-lg"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Review Answers
              </Button>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setAppState('select-level')}
                  variant="outline"
                  className="flex-1 h-14 text-lg"
                >
                  <Layers className="w-5 h-5 mr-2" />
                  New Quiz
                </Button>
                <Button 
                  onClick={() => setAppState('home')}
                  className="flex-1 h-14 text-lg bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Home
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Review Screen
  if (appState === 'review' && quizResult) {
    const selectedLevel = hskLevels.find(l => l.level === quizResult.level);
    
    // Determine the mode used in this quiz based on the first answer's options
    const getModeFromAnswer = (answer: QuizResult['answers'][0]) => {
      if (answer.options.includes(answer.question.english) && !answer.options.includes(answer.question.chinese)) {
        return 'chinese-to-english';
      } else if (answer.options.includes(answer.question.chinese) && !answer.options.includes(answer.question.english)) {
        // Could be english-to-chinese or pinyin-to-chinese
        if (answer.options.some(opt => opt === answer.question.pinyin)) {
          return 'pinyin-to-chinese';
        }
        return 'english-to-chinese';
      } else if (answer.options.includes(answer.question.pinyin)) {
        return 'chinese-to-pinyin';
      }
      return 'chinese-to-english'; // default
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setAppState('result')}>
              <ChevronRight className="w-5 h-5 mr-2 rotate-180" />
              Back to Results
            </Button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">Review Answers</h2>
              <Badge className={cn(
                "mt-1 text-white bg-gradient-to-r",
                selectedLevel?.color
              )}>
                {selectedLevel?.name}
              </Badge>
            </div>
            <div className="w-24" />
          </div>

          <div className="space-y-4">
            {quizResult.answers.map((answer, index) => {
              const mode = getModeFromAnswer(answer);
              const correctAnswer = getCorrectAnswer(answer.question, mode);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={cn(
                    "border-0 shadow-md",
                    answer.correct ? "bg-green-50" : "bg-red-50"
                  )}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={answer.correct ? "default" : "destructive"}>
                              Q{index + 1}
                            </Badge>
                            {answer.correct ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          
                          <p className="text-lg font-medium text-gray-800 mb-1">
                            {getQuestionText(answer.question, mode)} 
                            {(mode === 'chinese-to-english' || mode === 'chinese-to-pinyin') && 
                              <span className="text-gray-400 text-base ml-2">({answer.question.pinyin})</span>
                            }
                          </p>
                          {mode !== 'chinese-to-english' && mode !== 'chinese-to-pinyin' && 
                            <p className="text-gray-600 mb-3">{answer.question.english}</p>
                          }
                          
                          <div className="flex flex-wrap gap-2">
                            {answer.options.map((opt) => (
                              <Badge 
                                key={opt}
                                variant="outline"
                                className={cn(
                                  "px-3 py-1",
                                  opt === correctAnswer && "bg-green-200 border-green-400 text-green-800",
                                  opt === answer.userAnswer && !answer.correct && "bg-red-200 border-red-400 text-red-800"
                                )}
                              >
                                {opt}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button 
              onClick={() => setAppState('home')}
              className="h-14 px-8 text-lg bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Stats Screen
  if (appState === 'stats') {
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const overallProgress = totalQuestions > 0 ? Math.min((totalCorrect / totalQuestions) * 100, 100) : 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
            <Button variant="ghost" onClick={() => setAppState('home')} className="absolute top-6 left-6">
              <Home className="w-5 h-5 mr-2" />
              Home
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Your Statistics
            </h1>
            <p className="text-lg text-slate-500">Track your learning journey</p>
          </motion.div>

          <div className="grid gap-8">
            {/* Overall Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <BarChart3 className="w-6 h-6" />
                    Overall Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center group">
                      <div className="relative w-20 h-20 mx-auto mb-3">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            className="text-slate-200"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <motion.path
                            className="text-blue-500"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${overallProgress}, 100`}
                            initial={{ strokeDasharray: "0, 100" }}
                            animate={{ strokeDasharray: `${overallProgress}, 100` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Trophy className="w-8 h-8 text-blue-500" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-slate-800">{totalQuizzes}</p>
                      <p className="text-sm text-slate-500">Quizzes Taken</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-slate-800">{totalQuestions}</p>
                      <p className="text-sm text-slate-500">Questions Answered</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-green-700">{totalCorrect}</p>
                      <p className="text-sm text-green-600">Correct Answers</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-xl">
                      <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-yellow-700">{bestScore}%</p>
                      <p className="text-sm text-yellow-600">Best Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Target className="w-6 h-6 text-green-600" />
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-slate-600 font-medium">Overall Accuracy</span>
                        <span className="text-2xl font-bold text-slate-800">{accuracy}%</span>
                      </div>
                      <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${accuracy}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            className="text-slate-200"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <motion.path
                            className="text-green-500"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${accuracy}, 100`}
                            initial={{ strokeDasharray: "0, 100" }}
                            animate={{ strokeDasharray: `${accuracy}, 100` }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-slate-800">{accuracy}%</span>
                          <span className="text-xs text-slate-500">Accuracy</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Level-specific Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Layers className="w-6 h-6 text-blue-600" />
                    Level Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-3 gap-6">
                    {[1, 3, 4].map((level) => {
                      const stats = levelStats[level as HSKLevel];
                      const levelAccuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                      const levelColor = level === 1 ? 'green' : level === 3 ? 'purple' : 'orange';
                      const gradientFrom = level === 1 ? 'from-green-400' : level === 3 ? 'from-purple-400' : 'from-orange-400';
                      const gradientTo = level === 1 ? 'to-green-600' : level === 3 ? 'to-purple-600' : 'to-orange-600';
                      
                      return (
                        <motion.div
                          key={level}
                          whileHover={{ scale: 1.02, y: -5 }}
                          className={`p-6 bg-${levelColor}-50 rounded-2xl border-2 border-${levelColor}-100`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className={`text-lg font-bold text-${levelColor}-800`}>HSK Level {level}</h3>
                              <p className={`text-sm text-${levelColor}-600`}>{stats.quizzes} quizzes taken</p>
                            </div>
                            <Badge className={`bg-${levelColor}-500 text-white`}>{stats.quizzes}</Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className={`text-${levelColor}-700`}>Progress</span>
                              <span className={`font-bold text-${levelColor}-800`}>{levelAccuracy}%</span>
                            </div>
                            <div className="relative h-2 bg-white rounded-full overflow-hidden">
                              <motion.div
                                className={`absolute top-0 left-0 h-full bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-full`}
                                initial={{ width: 0 }}
                                animate={{ width: `${levelAccuracy}%` }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.4 + level * 0.1 }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{stats.correct} correct</span>
                              <span>{stats.total} total</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Vocabulary Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    Vocabulary Mastery
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="text-center">
                      <div className="relative w-40 h-40 mx-auto mb-4">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            className="text-slate-200"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <motion.path
                            className="text-blue-500"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray="75, 100"
                            initial={{ strokeDasharray: "0, 100" }}
                            animate={{ strokeDasharray: "75, 100" }}
                            transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-slate-800">1,200</span>
                          <span className="text-sm text-slate-500">Words</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Vocabulary Collection</h3>
                      <p className="text-slate-500">Complete HSK curriculum at your fingertips</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">Level 1</p>
                            <p className="text-sm text-slate-500">Beginner Foundation</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-white">300 words</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Brain className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">Level 3</p>
                            <p className="text-sm text-slate-500">Intermediate Skills</p>
                          </div>
                        </div>
                        <Badge className="bg-purple-500 text-white">300 words</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">Level 4</p>
                            <p className="text-sm text-slate-500">Advanced Mastery</p>
                          </div>
                        </div>
                        <Badge className="bg-orange-500 text-white">600 words</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <Button 
                onClick={() => setAppState('select-level')}
                className="h-16 px-10 text-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Play className="w-6 h-6 mr-3" />
                Continue Learning
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
