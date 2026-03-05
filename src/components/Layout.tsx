import { useAuth } from '../contexts/AuthContext';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, FileText, PlusCircle, Shield, User, Database } from 'lucide-react';

export default function Layout() {
  const { user, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'inspector': return 'bg-red-100 text-red-800';
      case 'asi': return 'bg-orange-100 text-orange-800';
      case 'writer': return 'bg-blue-100 text-blue-800';
      case 'constable': return 'bg-green-100 text-green-800';
      case 'judge': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isAdmin = user?.email === 'bharathkrishnan.t@gmail.com' || userProfile?.role === 'admin';
  const canViewDatabase = isAdmin || userProfile?.role === 'inspector';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-indigo-600">
            <Shield className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight">CrimeFile</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 ml-10">Police & Court System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>

          {(userProfile?.role === 'inspector' || userProfile?.role === 'asi' || userProfile?.role === 'writer') && (
            <Link
              to="/create-case"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/create-case' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              New Case File
            </Link>
          )}

          {canViewDatabase && (
            <Link
              to="/database"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/database' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Database className="w-5 h-5" />
              Database View
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {userProfile?.displayName?.charAt(0) || <User className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userProfile?.displayName || user.email}
              </p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(userProfile?.role || '')}`}>
                {userProfile?.role?.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
