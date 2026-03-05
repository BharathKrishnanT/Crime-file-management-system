import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, FileText, UserX, Gavel, Search, Shield, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DatabaseView() {
  const { userProfile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'police' | 'court' | 'cases' | 'subjects'>('police');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Permission check
  const isAdmin = user?.email === 'bharathkrishnan.t@gmail.com' || userProfile?.role === 'admin';
  const canViewDatabase = isAdmin || userProfile?.role === 'inspector';

  useEffect(() => {
    if (!canViewDatabase) return;
    fetchData();
  }, [activeTab, canViewDatabase]);

  const fetchData = async () => {
    setLoading(true);
    setData([]);
    try {
      let q;
      if (activeTab === 'police') {
        q = query(collection(db, 'users'), where('role', 'in', ['inspector', 'asi', 'writer', 'constable', 'admin']));
      } else if (activeTab === 'court') {
        q = query(collection(db, 'users'), where('role', '==', 'judge'));
      } else if (activeTab === 'cases' || activeTab === 'subjects') {
        q = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
      }

      if (q) {
        const snapshot = await getDocs(q);
        const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        setData(fetchedData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    if (activeTab === 'police' || activeTab === 'court') {
      return (
        item.displayName?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.role?.toLowerCase().includes(term) ||
        item.stationId?.toLowerCase().includes(term)
      );
    } else if (activeTab === 'cases') {
      return (
        item.title?.toLowerCase().includes(term) ||
        item.firNumber?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    } else if (activeTab === 'subjects') {
      return (
        item.victimDetails?.toLowerCase().includes(term) ||
        item.suspectDetails?.toLowerCase().includes(term) ||
        item.title?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  if (!canViewDatabase) {
    return (
      <div className="p-8 text-center text-red-500">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to view the master database.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            Master Database
          </h1>
          <p className="text-gray-500">Registry of police, court, cases, and subjects.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search database..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('police')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'police' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          Police Officers
        </button>
        <button
          onClick={() => setActiveTab('court')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'court' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Gavel className="w-4 h-4" />
          Court Officials
        </button>
        <button
          onClick={() => setActiveTab('cases')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'cases' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Case Files
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'subjects' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <UserX className="w-4 h-4" />
          Suspects & Victims
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading database records...</div>
        ) : (
          <div className="overflow-x-auto">
            {(activeTab === 'police' || activeTab === 'court') && (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Role</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Email</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Station ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900 flex items-center gap-2">
                        {user.role === 'judge' ? <Gavel className="w-4 h-4 text-purple-600" /> : <Shield className="w-4 h-4 text-indigo-600" />}
                        {user.displayName || 'N/A'}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                          ${user.role === 'judge' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'inspector' ? 'bg-red-100 text-red-800' :
                            user.role === 'asi' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{user.email}</td>
                      <td className="px-6 py-3 text-gray-500">{user.stationId || '-'}</td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'cases' && (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-500">FIR #</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Title</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Created By</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((kase) => (
                    <tr key={kase.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/cases/${kase.id}`}>
                      <td className="px-6 py-3 font-mono text-gray-600">{kase.firNumber}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{kase.title}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                          ${kase.status === 'open' ? 'bg-blue-100 text-blue-800' : 
                            kase.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                            'bg-purple-100 text-purple-800'}`}>
                          {kase.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{kase.creatorName || 'Unknown'}</td>
                      <td className="px-6 py-3 text-gray-500">
                        {kase.createdAt?.toDate ? kase.createdAt.toDate().toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No cases found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'subjects' && (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-500 w-1/4">Case Reference</th>
                    <th className="px-6 py-3 font-medium text-gray-500 w-1/3">Victim Details</th>
                    <th className="px-6 py-3 font-medium text-gray-500 w-1/3">Suspect Details</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((kase) => (
                    <tr key={kase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <a href={`/cases/${kase.id}`} className="font-medium text-indigo-600 hover:underline">
                          {kase.firNumber}
                        </a>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{kase.title}</p>
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        <div className="max-h-20 overflow-y-auto text-xs whitespace-pre-wrap">
                          {kase.victimDetails || <span className="text-gray-400 italic">Not recorded</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        <div className="max-h-20 overflow-y-auto text-xs whitespace-pre-wrap">
                          {kase.suspectDetails || <span className="text-gray-400 italic">Not recorded</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                          ${kase.status === 'open' ? 'bg-blue-100 text-blue-800' : 
                            kase.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                            'bg-purple-100 text-purple-800'}`}>
                          {kase.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No subjects found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
