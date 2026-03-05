import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

export default function CreateCase() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firNumber: '',
    title: '',
    description: '',
    status: 'open',
    victimDetails: '',
    suspectDetails: '',
    stationId: 'default-station' // In a real app, this would come from user profile
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'cases'), {
        ...formData,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        creatorName: userProfile?.displayName || user.displayName || 'Unknown'
      });
      navigate('/');
    } catch (error) {
      console.error("Error creating case:", error);
      alert("Failed to create case. Check permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h1 className="text-xl font-bold text-gray-900">New Case File</h1>
          <p className="text-sm text-gray-500 mt-1">Enter the details for the new First Information Report (FIR)</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">FIR Number</label>
              <input
                type="text"
                name="firNumber"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., FIR-2024-001"
                value={formData.firNumber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Case Title</label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief title of the incident"
                value={formData.title}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Detailed description of the incident..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Victim Details</label>
              <textarea
                name="victimDetails"
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Name, age, contact, etc."
                value={formData.victimDetails}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Suspect Details</label>
              <textarea
                name="suspectDetails"
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Name, description, etc."
                value={formData.suspectDetails}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Initial Status</label>
            <select
              name="status"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="open">Open</option>
              <option value="investigation">Investigation</option>
              <option value="hearing">Hearing</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Case File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
