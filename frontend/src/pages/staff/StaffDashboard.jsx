import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Plus, Edit, Trash2, ClipboardList, Clock, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function StaffDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('quizzes');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
      const [allQuizzes, allResults, allUsers] = await Promise.all([
        api.quizzes.getAll(),
        api.results.getAll(),
        api.users.getAll()
      ]);
      setQuizzes(allQuizzes.filter(q => q.createdBy === currentUser.id));
      setResults(allResults);
      setStudents(allUsers.filter(u => u.role === 'STUDENT'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteQuiz = async (id) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      try {
        await api.quizzes.delete(id);
        setQuizzes(quizzes.filter(q => q._id !== id));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleUpdateScore = async (resultId, newScore) => {
    const result = results.find(r => r._id === resultId);
    if (result) {
      try {
        const updatedResult = { ...result, score: newScore };
        await api.results.update(updatedResult);
        setResults(results.map(r => r._id === resultId ? updatedResult : r));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const exportQuizResults = (quiz) => {
    const quizResults = results.filter(r => r.quizId === quiz._id);
    
    if (quizResults.length === 0) {
      alert('No results found for this quiz.');
      return;
    }

    const data = quizResults.map(r => {
      // Find student details if not in result (for older results)
      const student = students.find(s => s.id === r.studentId);
      return {
        'Name': r.studentName,
        'Roll No': r.rollNo,
        'Department': r.department || student?.department || 'N/A',
        'Section': r.section || student?.section || 'N/A',
        'Score': `${r.score} / ${r.totalQuestions}`,
        'Submission Date': new Date(r.submittedAt).toLocaleString()
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    
    // Generate file name
    const fileName = `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-500">Manage your quizzes and monitor student performance</p>
        </div>
        <Link
          to="/staff/create-quiz"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" /> Create New Quiz
        </Link>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'quizzes' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Quizzes
          {activeTab === 'quizzes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'students' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Student List
          {activeTab === 'students' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'results' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Quiz Results
          {activeTab === 'results' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
      </div>

      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No quizzes created yet. Start by creating one!</p>
            </div>
          ) : (
            quizzes.map(quiz => (
              <div key={quiz._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{quiz.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportQuizResults(quiz)}
                      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                      title="Export Results to Excel"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigate(`/staff/edit-quiz/${quiz._id}`)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{quiz.description}</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{quiz.duration} Minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    <span>{quiz.questions.length} Questions</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {quiz.topic}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    new Date() > new Date(quiz.endTime) ? 'bg-red-100 text-red-700' :
                    new Date() < new Date(quiz.startTime) ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {new Date() > new Date(quiz.endTime) ? 'Ended' :
                     new Date() < new Date(quiz.startTime) ? 'Upcoming' : 'Active'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch/Sec</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{student.rollNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{student.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {student.batch} {student.section && `- ${student.section}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                const data = results.map(r => {
                  const student = students.find(s => s.id === r.studentId);
                  const quiz = quizzes.find(q => q.id === r.quizId);
                  return {
                    'Student Name': r.studentName,
                    'Roll No': r.rollNo,
                    'Quiz': quiz?.title || 'Deleted Quiz',
                    'Department': r.department || student?.department || 'N/A',
                    'Section': r.section || student?.section || 'N/A',
                    'Score': r.score,
                    'Total': r.totalQuestions,
                    'Submission Date': new Date(r.submittedAt).toLocaleString()
                  };
                });
                const worksheet = XLSX.utils.json_to_sheet(data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "All Results");
                XLSX.writeFile(workbook, "all_quiz_results.xlsx");
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
            >
              <Download className="w-5 h-5" /> Download All Results
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quiz</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map(result => (
                  <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{result.studentName}</div>
                      <div className="text-xs text-gray-500">{result.rollNo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {quizzes.find(q => q._id === result.quizId)?.title || 'Deleted Quiz'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{result.score}</span>
                        <span className="text-gray-400">/ {result.totalQuestions}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {new Date(result.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          const newScore = prompt('Enter new score:', result.score.toString());
                          if (newScore !== null) handleUpdateScore(result._id, parseInt(newScore));
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Update Marks
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
