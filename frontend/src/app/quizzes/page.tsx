'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Sparkles, HelpCircle, ChevronRight, Award, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function QuizzesPage() {
  const router = useRouter();
  const { token, updateUser } = useStore();

  const [topics, setTopics] = useState<any[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  
  // Flashcards States
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz solver states
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isQuestionAnswered, setIsQuestionAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [message, setMessage] = useState('');

  // Auto redirect if token missing
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token]);

  // Load Topics with Notes & Load Flashcards
  const loadInitialData = () => {
    if (token) {
      setLoading(true);
      api.get('/topic')
        .then((res: any[]) => {
          setTopics(res);
          // Auto select first note in first topic
          const firstTopicWithNotes = res.find(t => t.notes && t.notes.length > 0);
          if (firstTopicWithNotes) {
            setSelectedNoteId(firstTopicWithNotes.notes[0].id);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));

      loadFlashcards();
    }
  };

  const loadFlashcards = () => {
    setLoadingCards(true);
    api.get('/quiz/flashcards')
      .then((res) => {
        setFlashcards(res);
        setActiveCardIndex(0);
        setIsFlipped(false);
      })
      .catch(console.error)
      .finally(() => setLoadingCards(false));
  };

  useEffect(() => {
    loadInitialData();
  }, [token]);

  // Request new AI Quiz
  const handleGenerateQuiz = async () => {
    if (!selectedNoteId) return;
    setLoading(true);
    setMessage('');
    setActiveQuiz(null);
    setQuizFinished(false);
    
    try {
      const res = await api.post('/quiz/generate', { noteId: selectedNoteId });
      setActiveQuiz(res.quiz);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsQuestionAnswered(false);
      setCorrectAnswersCount(0);
      setMessage(`AI Quiz generated! Custom flashcards have been loaded in your card bank.`);
      setTimeout(() => setMessage(''), 3000);
      loadFlashcards(); // reload due cards
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Submit MCQ Answer
  const handleAnswerSubmit = (option: string, correctAnswer: string) => {
    if (isQuestionAnswered) return;
    setSelectedOption(option);
    setIsQuestionAnswered(true);

    if (option === correctAnswer) {
      setCorrectAnswersCount(prev => prev + 1);
      // Confetti for single correct
      confetti({ particleCount: 20, spread: 20 });
    }
  };

  // Move to next question or complete
  const handleNextQuestion = async () => {
    const totalQuestions = activeQuiz.questions.length;
    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsQuestionAnswered(false);
    } else {
      // Quiz finished
      setQuizFinished(true);
      const scorePercentage = Math.round((correctAnswersCount / totalQuestions) * 100);
      
      try {
        const res = await api.post('/quiz/submit', { scorePercentage });
        setMessage(`Quiz complete! Earned ${res.coinsEarned} coins & ${res.xpEarned} XP.`);
        
        // Refresh User Coin and XP
        const profile = await api.get('/auth/profile');
        updateUser(profile);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Spaced Repetition Card Review (SM-2 Quality 0-5)
  const handleReviewCard = async (quality: number) => {
    const card = flashcards[activeCardIndex];
    if (!card) return;

    try {
      await api.post('/quiz/flashcards/review', { cardId: card.id, quality });
      confetti({ particleCount: 15, spread: 30 });

      // Move forward
      if (activeCardIndex + 1 < flashcards.length) {
        setActiveCardIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        // finished batch
        setMessage('Wonderful! All pending flashcards reviewed.');
        loadFlashcards();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-cozy-lavender border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 mt-2">Connecting AI quiz engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-[#F3EFE6]">Active Testing Arena 🏆</h2>
          <p className="text-xs text-gray-500 mt-1">
            Test concepts with AI generated quizzes and review spaced-repetition card decks.
          </p>
        </div>

        {message && (
          <div className="bg-cozy-mint px-4 py-2 border border-cozy-mint-dark rounded-xl text-xs font-bold animate-pulse text-cozy-mint-deep">
            {message}
          </div>
        )}
      </div>

      {/* TWO SECTIONS: QUIZ BUILDER & FLASHCARDS BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION A: QUIZ GENERATOR & RUNNER */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center space-x-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
              <HelpCircle className="text-cozy-lavender-deep" size={18} />
              <h3 className="font-bold text-sm text-gray-800 dark:text-[#F3EFE6]">AI Topic Quizzer</h3>
            </div>

            {!activeQuiz ? (
              /* Setup Selector view */
              <div className="space-y-6">
                <p className="text-xs text-gray-500">
                  Select a logged notes outline to compile custom MCQs and conceptual questions.
                </p>

                <div className="space-y-3">
                  <label className="text-xs text-gray-400 font-semibold block">Select Study Note:</label>
                  <select
                    value={selectedNoteId}
                    onChange={(e) => setSelectedNoteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-cozy-lavender text-sm"
                  >
                    {topics.map(t =>
                      t.notes?.map((n: any) => (
                        <option key={n.id} value={n.id}>
                          {t.title} &rarr; {n.title}
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    onClick={handleGenerateQuiz}
                    disabled={!selectedNoteId}
                    className="w-full py-3 bg-cozy-lavender text-cozy-lavender-deep hover:bg-cozy-lavender-dark transition-all rounded-xl font-bold flex items-center justify-center space-x-2 text-sm shadow cursor-pointer"
                  >
                    <Sparkles size={16} />
                    <span>Generate AI Quiz</span>
                  </button>
                </div>
              </div>
            ) : quizFinished ? (
              /* Quiz Score view */
              <div className="text-center py-8 space-y-4">
                <Award size={48} className="text-cozy-yellow-deep mx-auto animate-float" />
                <h4 className="font-extrabold text-xl">Quiz Completed!</h4>
                <p className="text-xs text-gray-500">
                  You answered {correctAnswersCount} out of {activeQuiz.questions.length} questions correctly.
                </p>
                <div className="w-24 h-24 rounded-full border-4 border-cozy-lavender flex items-center justify-center mx-auto text-xl font-bold">
                  {Math.round((correctAnswersCount / activeQuiz.questions.length) * 100)}%
                </div>

                <button
                  onClick={() => setActiveQuiz(null)}
                  className="px-6 py-2 bg-cozy-mint text-cozy-mint-deep font-bold rounded-xl text-xs hover:bg-cozy-mint-dark cursor-pointer mt-4"
                >
                  Solve Another Note
                </button>
              </div>
            ) : (
              /* Live Quiz Runner View */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                  <span>Correct: {correctAnswersCount}</span>
                </div>

                {/* Question stem */}
                <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {activeQuiz.questions[currentQuestionIndex].questionText}
                  </p>
                </div>

                {/* Choices */}
                {activeQuiz.questions[currentQuestionIndex].type === 'MCQ' && (
                  <div className="space-y-2.5">
                    {JSON.parse(activeQuiz.questions[currentQuestionIndex].options || '[]').map((option: string, i: number) => {
                      const isCorrect = option === activeQuiz.questions[currentQuestionIndex].correctAnswer;
                      const isSelected = option === selectedOption;
                      
                      let btnStyle = 'border-gray-200 hover:border-cozy-lavender bg-white/50 dark:bg-black/10';
                      if (isQuestionAnswered) {
                        if (isCorrect) {
                          btnStyle = 'bg-cozy-mint/30 border-cozy-mint-deep text-green-700 font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-cozy-peach/30 border-cozy-peach-deep text-red-700';
                        } else {
                          btnStyle = 'opacity-40 border-gray-100 bg-white/10';
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswerSubmit(option, activeQuiz.questions[currentQuestionIndex].correctAnswer)}
                          disabled={isQuestionAnswered}
                          className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <span>{option}</span>
                          {isQuestionAnswered && isCorrect && <span>✅</span>}
                          {isQuestionAnswered && isSelected && !isCorrect && <span>❌</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Conceptual short answer explanation */}
                {activeQuiz.questions[currentQuestionIndex].type === 'SHORT' && (
                  <div className="space-y-3">
                    {!isQuestionAnswered ? (
                      <button
                        onClick={() => handleAnswerSubmit(activeQuiz.questions[currentQuestionIndex].correctAnswer, activeQuiz.questions[currentQuestionIndex].correctAnswer)}
                        className="w-full py-2 bg-cozy-sky text-cozy-sky-deep font-bold rounded-xl text-xs"
                      >
                        Reveal Model Answer
                      </button>
                    ) : (
                      <div className="p-3 bg-cozy-mint/20 border border-cozy-mint-dark rounded-xl text-xs text-gray-600">
                        <p className="font-bold text-cozy-mint-deep">Model Answer:</p>
                        <p className="mt-1">{activeQuiz.questions[currentQuestionIndex].correctAnswer}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation text box */}
                {isQuestionAnswered && (
                  <div className="p-3 bg-cozy-yellow/20 border border-cozy-yellow rounded-xl text-[11px] text-gray-500 mt-2">
                    <strong>Explanation:</strong> {activeQuiz.questions[currentQuestionIndex].explanation}
                  </div>
                )}

                {/* Action button */}
                {isQuestionAnswered && (
                  <button
                    onClick={handleNextQuestion}
                    className="w-full mt-3 py-2 bg-gray-800 text-white hover:bg-gray-700 font-bold text-xs rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    <span>Next Question</span>
                    <ChevronRight size={14} className="ml-1" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION B: SPACED REPETITION FLASHCARDS REVIEW */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="text-cozy-peach-deep" size={18} />
                <h3 className="font-bold text-sm text-gray-800 dark:text-[#F3EFE6]">Spaced Card Bank</h3>
              </div>
              <span className="text-[10px] bg-cozy-peach/30 text-cozy-peach-deep px-2 py-0.5 rounded font-extrabold animate-pulse">
                {flashcards.length} due cards
              </span>
            </div>

            {loadingCards ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-cozy-peach border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : flashcards.length > 0 ? (
              /* CARD DECK BOARD */
              <div className="space-y-6">
                <p className="text-xs text-gray-400 text-center">
                  Reviewing card {activeCardIndex + 1} of {flashcards.length}
                </p>

                {/* Animated flip box */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`relative w-full h-[180px] rounded-2xl border-2 border-dashed border-cozy-cream-dark bg-white dark:bg-black/10 cursor-pointer shadow flex items-center justify-center p-6 text-center transition-all duration-500 hover:shadow-lg ${
                    isFlipped ? 'border-cozy-lavender bg-cozy-lavender/5' : ''
                  }`}
                >
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-widest">
                      {isFlipped ? 'Answer Back' : 'Question Front'}
                    </span>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {isFlipped ? flashcards[activeCardIndex].back : flashcards[activeCardIndex].front}
                    </p>
                    <p className="text-[9px] text-gray-300 italic pt-4">Click card to flip</p>
                  </div>
                </div>

                {/* SM-2 Spaced grading keys */}
                {isFlipped && (
                  <div className="grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button
                      onClick={() => handleReviewCard(1)}
                      className="py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-[10px] font-bold text-red-600 cursor-pointer"
                    >
                      Hard (Next day review)
                    </button>
                    <button
                      onClick={() => handleReviewCard(3)}
                      className="py-2.5 bg-cozy-sky/30 hover:bg-cozy-sky/40 border border-cozy-sky/50 rounded-xl text-[10px] font-bold text-blue-600 cursor-pointer"
                    >
                      Good (Interval * Ease)
                    </button>
                    <button
                      onClick={() => handleReviewCard(5)}
                      className="py-2.5 bg-cozy-mint/30 hover:bg-cozy-mint/40 border border-cozy-mint/50 rounded-xl text-[10px] font-bold text-green-700 cursor-pointer"
                    >
                      Easy (+Unlock boost)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 dark:bg-black/10 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs text-gray-500 italic">
                🌸 No flashcards due today!<br/>Generate AI quizzes on your study notes to compile card decks.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
