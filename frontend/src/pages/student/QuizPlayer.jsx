import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Clock, AlertTriangle, CheckCircle2, Maximize } from 'lucide-react';

export default function QuizPlayer({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  const fetchQuiz = async () => {
    try {
      const quizzes = await api.quizzes.getAll();
      const q = quizzes.find(item => item._id === id);
      if (!q) {
        navigate('/');
        return;
      }
      setQuiz(q);
      setAnswers(new Array(q.questions.length).fill(-1));
      setTimeLeft(q.duration * 60);
    } catch (err) {
      console.error(err);
      navigate('/');
    }
  };

  useEffect(() => {
    fetchQuiz();

    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isFullScreen && !isFinished) {
        setViolations(v => v + 1);
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, navigate, isFullScreen, isFinished]);

  useEffect(() => {
    if (violations === 1) {
      setShowWarning(true);
    } else if (violations >= 2 && !isFinished) {
      handleSubmit();
    }
  }, [violations, isFinished]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished && isFullScreen) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isFinished) {
      handleSubmit();
    }
  }, [timeLeft, isFinished, isFullScreen]);

  const enterFullScreen = () => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => {
        setError(`Error attempting to enable full-screen mode: ${err.message}`);
        setTimeout(() => setError(''), 3000);
      });
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) score++;
    });

    const result = {
      quizId: quiz._id,
      studentId: user.id,
      studentName: user.name,
      rollNo: user.rollNo,
      department: user.department,
      section: user.section,
      score,
      totalQuestions: quiz.questions.length,
      answers,
      submittedAt: new Date().toISOString(),
    };

    try {
      await api.results.save(result);
      setIsFinished(true);
      if (document.fullscreenElement) document.exitFullscreen();
    } catch (err) {
      setError('Failed to submit quiz: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentQuestionIdx];
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      {!isFullScreen && !isFinished ? (
        <div className="max-w-2xl mx-auto pt-20 text-center space-y-6 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">×</button>
            </div>
          )}
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center gap-3 text-yellow-700">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p className="text-sm font-medium">This quiz must be taken in full-screen mode. Exiting full-screen will pause the timer.</p>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
          <div className="flex justify-center gap-8 text-gray-500">
            <div className="text-center">
              <p className="text-xs uppercase font-bold">Questions</p>
              <p className="text-xl font-bold text-gray-900">{quiz.questions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase font-bold">Duration</p>
              <p className="text-xl font-bold text-gray-900">{quiz.duration}m</p>
            </div>
          </div>
          <button
            onClick={enterFullScreen}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Maximize className="w-5 h-5" /> Enter Full Screen & Start
          </button>
        </div>
      ) : isFinished ? (
        <div className="max-w-md mx-auto pt-20 text-center space-y-6 p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Submitted!</h1>
          <p className="text-gray-500">Your responses have been recorded successfully.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="fixed inset-0 bg-gray-50 flex flex-col p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-sm border">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
                <p className="text-sm text-gray-500">Question {currentQuestionIdx + 1} of {quiz.questions.length}</p>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-indigo-100 text-indigo-600'}`}>
                <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
              </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border p-6 md:p-10 space-y-8">
              {currentQuestion.image && (
                <img src={currentQuestion.image} alt="Question" className="max-h-64 mx-auto rounded-xl object-contain mb-6" />
              )}
              <h3 className="text-2xl font-medium text-gray-900 leading-relaxed">
                {currentQuestion.text}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const newAnswers = [...answers];
                      newAnswers[currentQuestionIdx] = idx;
                      setAnswers(newAnswers);
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      answers[currentQuestionIdx] === idx
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                        : 'border-gray-100 hover:border-gray-200 text-gray-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      answers[currentQuestionIdx] === idx ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                    }`}>
                      {answers[currentQuestionIdx] === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-lg">{opt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center pb-8">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(i => i - 1)}
                className="px-6 py-2 rounded-lg font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                Previous
              </button>
              
              <div className="flex gap-2">
                {quiz.questions.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full ${
                    idx === currentQuestionIdx ? 'bg-indigo-600' :
                    answers[idx] !== -1 ? 'bg-indigo-200' : 'bg-gray-200'
                  }`} />
                ))}
              </div>

              {currentQuestionIdx === quiz.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIdx(i => i + 1)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showWarning && !isFinished && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Warning!</h2>
              <p className="text-gray-600">
                Tab switching is not allowed during the quiz. This is your <span className="font-bold text-red-600 underline">FIRST and ONLY warning</span>.
              </p>
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                If you switch tabs again, your quiz will be <span className="font-bold">automatically submitted</span> with your current progress.
              </p>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
            >
              I Understand, Continue Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
