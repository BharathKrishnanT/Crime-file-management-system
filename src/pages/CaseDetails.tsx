import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, collection, addDoc, query, where, getDocs, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Trash2, Edit2, Save, X, FileText, User, AlertTriangle, Plus, ExternalLink, History } from 'lucide-react';

export default function CaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [files, setFiles] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [newFile, setNewFile] = useState({ type: 'evidence', url: '', description: '' });
  const [creatorName, setCreatorName] = useState('');

  const [permissionDenied, setPermissionDenied] = useState(false);

  // Permissions
  const isAdmin = user?.email === 'bharathkrishnan.t@gmail.com' || userProfile?.role === 'admin';
  const canEdit = isAdmin || userProfile?.role === 'inspector' || userProfile?.role === 'asi';
  const canDelete = isAdmin || userProfile?.role === 'inspector';
  const canAddFile = isAdmin || userProfile?.role === 'inspector' || userProfile?.role === 'asi' || userProfile?.role === 'writer';

  useEffect(() => {
    if (!id || authLoading) return;
    
    if (!userProfile) {
      setLoading(false);
      return;
    }

    // Validate role to prevent unnecessary permission denied errors
    const validRoles = ['inspector', 'asi', 'writer', 'constable', 'judge', 'admin'];
    const isSuperAdmin = user?.email === 'bharathkrishnan.t@gmail.com';

    if (!validRoles.includes(userProfile.role) && !isSuperAdmin) {
      console.warn("User has invalid role:", userProfile.role);
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    // Listen to case details
    const unsubCase = onSnapshot(doc(db, 'cases', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCaseData({ id: docSnap.id, ...data });
        setEditForm(data);
        setLoading(false);

        // Use denormalized creatorName if available, otherwise try to fetch (only if user is owner or admin)
        if (data.creatorName) {
          setCreatorName(data.creatorName);
        } else if (data.createdBy) {
           // Fallback for old data: try to fetch, but handle permission error silently
           getDoc(doc(db, 'users', data.createdBy)).then(userSnap => {
            if (userSnap.exists()) {
              setCreatorName(userSnap.data().displayName || 'Unknown');
            }
          }).catch(() => {
            // Ignore permission errors for non-owners
            setCreatorName('Unknown (Restricted)');
          });
        }
      } else {
        alert("Case not found");
        navigate('/');
      }
    }, (error) => {
      if (error.code === 'permission-denied') {
        setPermissionDenied(true);
        setLoading(false);
      } else {
        console.error("Error fetching case details:", error);
        setLoading(false);
      }
    });

    // Listen to files
    const qFiles = query(collection(db, `cases/${id}/files`));
    const unsubFiles = onSnapshot(qFiles, (snapshot) => {
      setFiles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      if (error.code !== 'permission-denied') {
        console.error("Error fetching files:", error);
      }
    });

    // Listen to history
    const qHistory = query(collection(db, `cases/${id}/history`), orderBy('timestamp', 'desc'));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      if (error.code !== 'permission-denied') {
        console.error("Error fetching history:", error);
      }
    });

    return () => {
      unsubCase();
      unsubFiles();
      unsubHistory();
    };
  }, [id, navigate, authLoading, userProfile, user]);

  const addHistoryRecord = async (action: string, details: string) => {
    if (!id || !user) return;
    try {
      await addDoc(collection(db, `cases/${id}/history`), {
        action,
        details,
        performedBy: user.uid,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding history record:", error);
    }
  };

  const handleUpdate = async () => {
    if (!id || !canEdit) return;
    try {
      // Create a copy of editForm and remove immutable fields
      const { createdAt, createdBy, ...updateData } = editForm;
      
      await updateDoc(doc(db, 'cases', id), updateData);
      await addHistoryRecord('Case Updated', `Case details updated by ${userProfile?.displayName || user?.email}`);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating case:", error);
      alert("Failed to update case.");
    }
  };

  const handleDelete = async () => {
    if (!id || !canDelete) return;
    if (window.confirm("Are you sure you want to delete this case? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'cases', id));
        // Note: History is deleted with the case if we delete the parent, 
        // but subcollections technically persist in Firestore unless recursively deleted.
        // For this app, we'll just navigate away.
        navigate('/');
      } catch (error) {
        console.error("Error deleting case:", error);
        alert("Failed to delete case.");
      }
    }
  };

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !canAddFile) return;
    try {
      await addDoc(collection(db, `cases/${id}/files`), {
        ...newFile,
        uploadedBy: user.uid,
        createdAt: serverTimestamp()
      });
      await addHistoryRecord('File Added', `New file (${newFile.type}) added: ${newFile.description}`);
      setShowFileModal(false);
      setNewFile({ type: 'evidence', url: '', description: '' });
    } catch (error) {
      console.error("Error adding file:", error);
      alert("Failed to add file.");
    }
  };

  const handleDeleteFile = async (fileId: string, description: string) => {
    if (!id || !canDelete) return;
    if (window.confirm("Delete this file record?")) {
      try {
        await deleteDoc(doc(db, `cases/${id}/files`, fileId));
        await addHistoryRecord('File Deleted', `File deleted: ${description}`);
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }
  };

  if (authLoading || (loading && (userProfile || user?.email === 'bharathkrishnan.t@gmail.com'))) return <div className="p-8 text-center text-gray-500">Loading case details...</div>;
  if (!userProfile && user?.email !== 'bharathkrishnan.t@gmail.com') return <div className="p-8 text-center text-red-500">Access Denied: User profile not found.</div>;
  
  if (permissionDenied) {
    return (
      <div className="p-8 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 max-w-md">
            You do not have permission to view this case details. Please contact your administrator if you believe this is an error.
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!caseData) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        <div className="flex gap-2">
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-gray-700 hover:bg-stone-100 transition-colors shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit Case
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 hover:bg-red-100 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete Case
            </button>
          )}
        </div>
      </div>

      <div className="bg-stone-50 rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-200 bg-stone-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="bg-stone-50 border border-stone-300 rounded px-2 py-1"
                />
              ) : caseData.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">FIR: {caseData.firNumber}</p>
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span>Created By: {creatorName || 'Loading...'}</span>
              <span>Station ID: {caseData.stationId || 'N/A'}</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            caseData.status === 'open' ? 'bg-blue-100 text-blue-800' :
            caseData.status === 'closed' ? 'bg-gray-100 text-gray-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {isEditing ? (
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="bg-stone-50 border border-stone-300 rounded px-2 py-1 text-sm"
              >
                <option value="open">Open</option>
                <option value="investigation">Investigation</option>
                <option value="hearing">Hearing</option>
                <option value="closed">Closed</option>
              </select>
            ) : caseData.status.toUpperCase()}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Section title="Description" icon={<FileText className="w-5 h-5 text-gray-400" />}>
              {isEditing ? (
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border border-stone-300 rounded p-2"
                  rows={4}
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{caseData.description}</p>
              )}
            </Section>

            <Section title="Victim Details" icon={<User className="w-5 h-5 text-blue-400" />}>
              {isEditing ? (
                <textarea
                  value={editForm.victimDetails}
                  onChange={(e) => setEditForm({ ...editForm, victimDetails: e.target.value })}
                  className="w-full border border-stone-300 rounded p-2"
                  rows={3}
                />
              ) : (
                <p className="text-gray-700">{caseData.victimDetails || 'No details recorded.'}</p>
              )}
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Suspect Details" icon={<AlertTriangle className="w-5 h-5 text-orange-400" />}>
              {isEditing ? (
                <textarea
                  value={editForm.suspectDetails}
                  onChange={(e) => setEditForm({ ...editForm, suspectDetails: e.target.value })}
                  className="w-full border border-stone-300 rounded p-2"
                  rows={3}
                />
              ) : (
                <p className="text-gray-700">{caseData.suspectDetails || 'No details recorded.'}</p>
              )}
            </Section>

            <Section title="Attached Files" icon={<FileText className="w-5 h-5 text-gray-400" />}>
              <div className="space-y-3">
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-stone-100 rounded-lg border border-stone-200">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-stone-50 rounded border border-stone-300">
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.description || file.type}</p>
                        <a href={file.url} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                          View File <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    {canDelete && (
                      <button onClick={() => handleDeleteFile(file.id, file.description || file.type)} className="text-gray-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {files.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No files attached.</p>
                )}

                {canAddFile && (
                  <button
                    onClick={() => setShowFileModal(true)}
                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add File Record
                  </button>
                )}
              </div>
            </Section>

            <Section title="Case History" icon={<History className="w-5 h-5 text-purple-400" />}>
              <div className="space-y-4">
                {history.map((record) => (
                  <div key={record.id} className="relative pl-4 border-l-2 border-gray-200 pb-4 last:pb-0">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-300"></div>
                    <p className="text-sm font-medium text-gray-900">{record.action}</p>
                    <p className="text-xs text-gray-500">{record.details}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {record.timestamp?.toDate().toLocaleString()}
                    </p>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No history recorded.</p>
                )}
              </div>
            </Section>
          </div>
        </div>

        {isEditing && (
          <div className="p-6 bg-stone-100 border-t border-stone-200 flex justify-end gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-gray-700 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Add File Modal */}
      {showFileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-50 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add File Record</h3>
              <button onClick={() => setShowFileModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddFile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                <select
                  className="w-full border border-stone-300 rounded-lg px-3 py-2"
                  value={newFile.type}
                  onChange={(e) => setNewFile({ ...newFile, type: e.target.value })}
                >
                  <option value="fir">FIR Document</option>
                  <option value="victim">Victim Statement</option>
                  <option value="suspect">Suspect Record</option>
                  <option value="evidence">Evidence</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  className="w-full border border-stone-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Forensic Report"
                  value={newFile.description}
                  onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File URL / Location</label>
                <input
                  type="url"
                  required
                  className="w-full border border-stone-300 rounded-lg px-3 py-2"
                  placeholder="https://..."
                  value={newFile.url}
                  onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Enter a URL to the file location.</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFileModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="pl-7">
        {children}
      </div>
    </div>
  );
}
