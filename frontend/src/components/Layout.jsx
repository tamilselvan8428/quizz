import { Outlet, Link, useNavigate, Navigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, GraduationCap } from 'lucide-react';
import logo from '../images.png';

export default function Layout({ user, onLogout }) {
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img 
            src={logo} 
            alt="Quizmoz Logo" 
            className="w-10 h-10 object-contain"
          />
          <span className="text-xl font-bold text-gray-900">Quizmoz</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            {user.role === 'STUDENT' && (
              <Link to="/student/learning" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
                <GraduationCap className="w-4 h-4" /> Learning
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 border-l pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">{user.role}</p>
            </div>
            <button
              onClick={() => {
                onLogout();
                navigate('/login');
              }}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
