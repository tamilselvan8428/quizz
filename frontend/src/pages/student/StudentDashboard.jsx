import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { ClipboardList, Award, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function StudentDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [user, setUser] = useState(null);

  const fetchData = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
      setUser(currentUser);
      const [allQuizzes, allResults] = await Promise.all([
        api.quizzes.getAll(),
        api.results.getAll()
      ]);
      setQuizzes(allQuizzes);
      setResults(allResults.filter(r => r.studentId === currentUser.id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isQuizAvailable = (quiz) => {
    const now = new Date();
    const start = new Date(quiz.startTime);
    const end = new Date(quiz.endTime);
    const alreadyTaken = results.some(r => r.quizId === quiz._id);
    return now >= start && now <= end && !alreadyTaken;
  };

  const isQuizUpcoming = (quiz) => {
    const now = new Date();
    const start = new Date(quiz.startTime);
    const alreadyTaken = results.some(r => r.quizId === quiz._id);
    return now < start && !alreadyTaken;
  };

  return (
    <div className="space-y-8">
      <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-200">
        <h1 className="text-3xl font-bold mb-2">Hello, {user?.name}!</h1>
        <p className="text-indigo-100 opacity-90">Ready to test your knowledge today?</p>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('available')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'available' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Available Quizzes
          {activeTab === 'available' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'upcoming' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Upcoming Quizzes
          {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'results' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Results
          {activeTab === 'results' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
      </div>

      {activeTab === 'available' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.filter(isQuizAvailable).length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No quizzes available at the moment.</p>
            </div>
          ) : (
            quizzes.filter(isQuizAvailable).map(quiz => (
              <div key={quiz._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{quiz.title}</h3>
                <p className="text-gray-600 text-sm mb-4 flex-1">{quiz.description}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Ends: {new Date(quiz.endTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ClipboardList className="w-4 h-4" />
                    <span>{quiz.questions.length} Questions • {quiz.duration} mins</span>
                  </div>
                </div>
                <Link
                  to={`/student/quiz/${quiz._id}`}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold text-center hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  Start Quiz <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.filter(isQuizUpcoming).length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming quizzes scheduled.</p>
            </div>
          ) : (
            quizzes.filter(isQuizUpcoming).map(quiz => (
              <div key={quiz._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col opacity-75">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{quiz.title}</h3>
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">Upcoming</span>
                </div>
                <p className="text-gray-600 text-sm mb-4 flex-1">{quiz.description}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Starts: {new Date(quiz.startTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ClipboardList className="w-4 h-4" />
                    <span>{quiz.questions.length} Questions • {quiz.duration} mins</span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 py-2 rounded-lg font-semibold text-center cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Not Yet Started
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">You haven't completed any quizzes yet.</p>
            </div>
          ) : (
            results.map(result => {
              const quiz = quizzes.find(q => q._id === result.quizId);
              const percentage = (result.score / result.totalQuestions) * 100;
              
              return (
                <div key={result._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{quiz?.title || 'Deleted Quiz'}</h3>
                      <p className="text-sm text-gray-500">Submitted on {new Date(result.submittedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase font-bold">Score</p>
                        <p className={`text-2xl font-black ${percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {result.score}/{result.totalQuestions}
                        </p>
                      </div>
                      <div className="h-12 w-px bg-gray-100" />
                      <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase font-bold">Status</p>
                        <div className="flex items-center gap-1 text-green-600 font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Completed
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Show answers after quiz ends */}
                  {quiz && new Date() > new Date(quiz.endTime) && (
                    <div className="mt-6 pt-6 border-t border-gray-50">
                      <h4 className="font-bold text-gray-900 mb-4">Review Answers</h4>
                      <div className="space-y-4">
                        {quiz.questions.map((q, idx) => (
                          <div key={q.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <p className="font-medium text-gray-900 mb-2">{idx + 1}. {q.text}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt, oIdx) => {
                                const isCorrect = oIdx === q.correctAnswer;
                                const isStudentAnswer = oIdx === result.answers[idx];
                                return (
                                  <div key={oIdx} className={`p-2 rounded border text-sm ${
                                    isCorrect ? 'bg-green-50 border-green-200 text-green-700' :
                                    isStudentAnswer ? 'bg-red-50 border-red-200 text-red-700' :
                                    'bg-white border-gray-200 text-gray-600'
                                  }`}>
                                    {opt}
                                    {isCorrect && ' (Correct)'}
                                    {isStudentAnswer && !isCorrect && ' (Your Answer)'}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
