import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';

export default function Login() {
  const { signIn, userProfile, setUserRole, user } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'inspector' | 'asi' | 'writer' | 'constable' | 'judge' | ''>('');
  const [firNumber, setFirNumber] = useState('');
  const [isSettingRole, setIsSettingRole] = useState(false);

  const handleLogin = async () => {
    try {
      await signIn();
      // Navigation happens in useEffect or after role check
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleRoleSelection = async () => {
    if (!selectedRole) return;
    if (selectedRole === 'writer' && !firNumber.trim()) return;
    
    setIsSettingRole(true);
    try {
      await setUserRole(selectedRole, firNumber.trim() || undefined);
      navigate('/');
    } catch (error) {
      console.error("Failed to set role", error);
    } finally {
      setIsSettingRole(false);
    }
  };

  useEffect(() => {
    if (user && userProfile) {
      navigate('/');
    }
  }, [user, userProfile, navigate]);

  if (user && !userProfile) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-50 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <UserRoleIcon role={selectedRole || 'constable'} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Select Your Role</h2>
            <p className="text-gray-500 mt-2">Complete your profile to continue</p>
          </div>

          <div className="space-y-3">
            {['inspector', 'asi', 'writer', 'constable', 'judge'].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role as any)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                  selectedRole === role
                    ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                    : 'border-stone-200 hover:border-emerald-200 hover:bg-stone-100'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  selectedRole === role ? 'bg-emerald-200' : 'bg-stone-200'
                }`}>
                  <UserRoleIcon role={role} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 capitalize">{role === 'asi' ? 'Assistant Sub-Inspector' : role}</h3>
                  <p className="text-xs text-gray-500">{getRoleDescription(role)}</p>
                </div>
              </button>
            ))}
          </div>

          {selectedRole === 'writer' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label htmlFor="firNumber" className="block text-sm font-medium text-gray-700">
                FIR Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firNumber"
                value={firNumber}
                onChange={(e) => setFirNumber(e.target.value)}
                placeholder="Enter your FIR Number"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          )}

          <button
            onClick={handleRoleSelection}
            disabled={!selectedRole || (selectedRole === 'writer' && !firNumber.trim()) || isSettingRole}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSettingRole ? 'Setting up...' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  if (user && userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-stone-50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 transform -rotate-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CrimeFile</h1>
            <p className="text-gray-500 mt-2">Secure Case Management System</p>
          </div>

          <div className="space-y-4 pt-4">
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-stone-50 border border-stone-300 hover:bg-stone-100 text-gray-700 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>
          </div>
        </div>
        <div className="bg-stone-100 p-6 text-center border-t border-stone-200">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}

function UserRoleIcon({ role }: { role: string }) {
  // Simple placeholder logic for icons
  return <Shield className="w-5 h-5 text-gray-600" />;
}

function getRoleDescription(role: string) {
  switch (role) {
    case 'inspector': return 'Full access to manage cases and files';
    case 'asi': return 'View and edit cases, cannot delete';
    case 'writer': return 'Create new cases, view existing';
    case 'constable': return 'View only access';
    case 'judge': return 'Court access to case files';
    default: return '';
  }
}
