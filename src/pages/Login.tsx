import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';

export default function Login() {
  const { signIn, userProfile, setUserRole, user } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'inspector' | 'asi' | 'writer' | 'constable' | 'judge' | ''>('');
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
    setIsSettingRole(true);
    try {
      await setUserRole(selectedRole);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
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
                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                    : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  selectedRole === role ? 'bg-indigo-200' : 'bg-gray-100'
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

          <button
            onClick={handleRoleSelection}
            disabled={!selectedRole || isSettingRole}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform -rotate-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CrimeFile</h1>
            <p className="text-gray-500 mt-2">Secure Case Management System</p>
          </div>

          <div className="space-y-4 pt-4">
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>
          </div>
        </div>
        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
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
