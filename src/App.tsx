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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              HSK Quiz
            </h1>
            <p className="text-xl text-gray-600">Master Chinese Vocabulary</p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">{totalQuizzes}</p>
                <p className="text-sm text-gray-500">Quizzes Taken</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">{totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0}%</p>
                <p className="text-sm text-gray-500">Accuracy</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <Star className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">{bestScore}%</p>
                <p className="text-sm text-gray-500">Best Score</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <Layers className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">{vocabularyByLevel[1].length + vocabularyByLevel[3].length + vocabularyByLevel[4].length}</p>
                <p className="text-sm text-gray-500">Total Words</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <Button 
              onClick={() => setAppState('select-level')}
              className="h-24 text-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="w-6 h-6 mr-3" />
              Start Quiz
            </Button>
            <Button 
              onClick={() => setAppState('stats')}
              variant="outline"
              className="h-24 text-xl border-2 hover:bg-white/50"
            >
              <BarChart3 className="w-6 h-6 mr-3" />
              View Stats
            </Button>
          </motion.div>

          {/* Features */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid md:grid-cols-3 gap-6"
          >
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Layers className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Three HSK Levels</h3>
              <p className="text-gray-500 text-sm">Practice Level 1, 3, or 4 - from beginner to advanced</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Multiple Quiz Modes</h3>
              <p className="text-gray-500 text-sm">Chinese to English, Pinyin practice, and mixed modes</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Modern Design</h3>
              <p className="text-gray-500 text-sm">Beautiful interface with smooth animations</p>
            </div>
          </motion.div>
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <Button variant="ghost" onClick={() => setAppState('select-level')}>
                <ChevronRight className="w-5 h-5 mr-2 rotate-180" />
                Back
              </Button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Quiz Settings</h2>
                <Badge className={cn(
                  "mt-1 bg-gradient-to-r",
                  selectedLevel?.color
                )}>
                  {selectedLevel?.name}
                </Badge>
              </div>
              <div className="w-20" />
            </div>

            {/* Quiz Mode */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">Quiz Mode</label>
              <div className="grid gap-3">
                {quizModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setQuizSettings({ ...quizSettings, mode: mode.id })}
                    className={cn(
                      "flex items-center p-4 rounded-xl border-2 transition-all text-left",
                      quizSettings.mode === mode.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <mode.icon className={cn(
                      "w-6 h-6 mr-4",
                      quizSettings.mode === mode.id ? "text-indigo-600" : "text-gray-400"
                    )} />
                    <div>
                      <p className={cn(
                        "font-semibold",
                        quizSettings.mode === mode.id ? "text-indigo-900" : "text-gray-700"
                      )}>{mode.name}</p>
                      <p className="text-sm text-gray-500">{mode.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">Number of Questions</label>
              <div className="flex flex-wrap gap-3">
                {questionCountOptions.map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuizSettings({ ...quizSettings, questionCount: count })}
                    className={cn(
                      "px-6 py-3 rounded-xl border-2 font-semibold transition-all",
                      quizSettings.questionCount === count
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Limit */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">Time Limit (Optional)</label>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setQuizSettings({ ...quizSettings, timeLimit: null })}
                  className={cn(
                    "px-6 py-3 rounded-xl border-2 font-semibold transition-all",
                    quizSettings.timeLimit === null
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  No Limit
                </button>
                {[5, 10, 15].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => setQuizSettings({ ...quizSettings, timeLimit: minutes * 60 })}
                    className={cn(
                      "px-6 py-3 rounded-xl border-2 font-semibold transition-all",
                      quizSettings.timeLimit === minutes * 60
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </div>

            {/* Show Pinyin */}
            <div className="mb-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quizSettings.showPinyin}
                  onChange={(e) => setQuizSettings({ ...quizSettings, showPinyin: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700">Show Pinyin hints</span>
              </label>
            </div>

            <Button 
              onClick={startQuiz}
              className="w-full h-14 text-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Quiz
            </Button>
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleAnswer(option)}
                      disabled={isAnswered}
                      className={cn(
                        "p-5 rounded-xl border-2 text-left transition-all duration-200",
                        !isAnswered && "hover:border-indigo-300 hover:bg-indigo-50",
                        isAnswered && isCorrect && "border-green-500 bg-green-50",
                        isAnswered && isSelected && !isCorrect && "border-red-500 bg-red-50",
                        isAnswered && !isSelected && !isCorrect && "border-gray-200 opacity-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-lg font-medium",
                          isAnswered && isCorrect && "text-green-700",
                          isAnswered && isSelected && !isCorrect && "text-red-700"
                        )}>
                          {option} 
                        </span>
                        {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                        {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500" />}
                      </div>
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
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => setAppState('home')}>
              <Home className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-bold text-gray-800">Your Statistics</h2>
            <div className="w-20" />
          </div>

          <div className="grid gap-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-indigo-50 rounded-xl">
                    <p className="text-4xl font-bold text-indigo-700">{totalQuizzes}</p>
                    <p className="text-gray-600">Quizzes Taken</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <p className="text-4xl font-bold text-purple-700">{totalQuestions}</p>
                    <p className="text-gray-600">Questions Answered</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Accuracy Rate</span>
                      <span className="font-bold text-gray-800">{accuracy}%</span>
                    </div>
                    <Progress value={accuracy} className="h-3" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <p className="text-3xl font-bold text-green-700">{totalCorrect}</p>
                      <p className="text-gray-600">Correct Answers</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-xl">
                      <p className="text-3xl font-bold text-yellow-700">{bestScore}%</p>
                      <p className="text-gray-600">Best Score</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level-specific Stats */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-green-800">HSK Level 1</span>
                      <Badge className="bg-green-500">{levelStats[1].quizzes} quizzes</Badge>
                    </div>
                    <Progress 
                      value={levelStats[1].total > 0 ? (levelStats[1].correct / levelStats[1].total) * 100 : 0} 
                      className="h-2" 
                    />
                    <p className="text-sm text-green-600 mt-1">
                      {levelStats[1].total > 0 ? Math.round((levelStats[1].correct / levelStats[1].total) * 100) : 0}% accuracy
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-purple-800">HSK Level 3</span>
                      <Badge className="bg-purple-500">{levelStats[3].quizzes} quizzes</Badge>
                    </div>
                    <Progress 
                      value={levelStats[3].total > 0 ? (levelStats[3].correct / levelStats[3].total) * 100 : 0} 
                      className="h-2" 
                    />
                    <p className="text-sm text-purple-600 mt-1">
                      {levelStats[3].total > 0 ? Math.round((levelStats[3].correct / levelStats[3].total) * 100) : 0}% accuracy
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-orange-800">HSK Level 4</span>
                      <Badge className="bg-orange-500">{levelStats[4].quizzes} quizzes</Badge>
                    </div>
                    <Progress 
                      value={levelStats[4].total > 0 ? (levelStats[4].correct / levelStats[4].total) * 100 : 0} 
                      className="h-2" 
                    />
                    <p className="text-sm text-orange-600 mt-1">
                      {levelStats[4].total > 0 ? Math.round((levelStats[4].correct / levelStats[4].total) * 100) : 0}% accuracy
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Vocabulary Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-blue-50 rounded-xl">
                  <p className="text-5xl font-bold text-blue-700 mb-2">1200</p>
                  <p className="text-gray-600">Total Words Available</p>
                  <div className="flex justify-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
                    <span>Level 1: 300 words</span>
                    <span>•</span>
                    <span>Level 3: 300 words</span>
                    <span>•</span>
                    <span>Level 4: 600 words</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => setAppState('select-level')}
              className="h-14 text-lg bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              <Play className="w-5 h-5 mr-2" />
              Start New Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
