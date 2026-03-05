import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FileText, Clock, AlertCircle, CheckCircle, Search, Filter } from 'lucide-react';

interface Case {
  id: string;
  firNumber: string;
  title: string;
  status: 'open' | 'closed' | 'hearing' | 'investigation';
  createdAt: any;
  createdBy: string;
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedOfficer, setAssignedOfficer] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const casesRef = collection(db, 'cases');
        // Simple query for now, can be optimized
        const q = query(casesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const casesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Case[];
        setCases(casesData);
      } catch (error) {
        console.error("Error fetching cases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const filteredCases = cases.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.firNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (startDate && c.createdAt) {
      const caseDate = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      matchesDate = matchesDate && caseDate >= new Date(startDate);
    }
    if (endDate && c.createdAt) {
      const caseDate = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      // Set end date to end of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && caseDate <= end;
    }

    let matchesOfficer = true;
    if (assignedOfficer) {
      // In a real app, we'd probably join with users or have officer name denormalized
      // For now, we'll filter by exact ID match if provided, or partial match if we had names
      // Since we only have createdBy (UID) in the case model, filtering by "assigned officer" 
      // is tricky without fetching user details. 
      // Assuming the user might type a UID or we just check if createdBy matches the input.
      // A better approach for this demo is to filter by createdBy UID if the user enters it,
      // or maybe we just skip this if we can't easily map names.
      // Let's assume for this requirement "assigned officer" means the creator.
      matchesOfficer = c.createdBy.includes(assignedOfficer);
    }

    return matchesStatus && matchesSearch && matchesDate && matchesOfficer;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'hearing': return 'bg-purple-100 text-purple-800';
      case 'investigation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {userProfile?.role === 'asi' ? 'ASI' : userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1)} {userProfile?.displayName}</p>
        </div>
        {(userProfile?.role === 'inspector' || userProfile?.role === 'asi' || userProfile?.role === 'writer') && (
          <Link
            to="/create-case"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Create New Case
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Cases" value={cases.length} icon={<FileText className="text-indigo-600" />} />
        <StatCard title="Open Cases" value={cases.filter(c => c.status === 'open').length} icon={<AlertCircle className="text-blue-600" />} />
        <StatCard title="In Hearing" value={cases.filter(c => c.status === 'hearing').length} icon={<Clock className="text-purple-600" />} />
        <StatCard title="Closed" value={cases.filter(c => c.status === 'closed').length} icon={<CheckCircle className="text-gray-600" />} />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by FIR Number or Title..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-5 h-5" />
          <select
            className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigation">Investigation</option>
            <option value="hearing">Hearing</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-sm text-gray-500 whitespace-nowrap">Date Range:</span>
          <input
            type="date"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
          <span className="text-sm text-gray-500 whitespace-nowrap">Officer ID:</span>
          <input
            type="text"
            placeholder="Filter by Officer UID..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={assignedOfficer}
            onChange={(e) => setAssignedOfficer(e.target.value)}
          />
        </div>
      </div>

      {/* Cases List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">FIR Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading cases...</td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No cases found.</td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.firNumber}</td>
                    <td className="px-6 py-4 text-gray-600">{c.title}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/cases/${c.id}`}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
