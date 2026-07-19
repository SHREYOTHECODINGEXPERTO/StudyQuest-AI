'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Sparkles, FileText, Upload, Plus, Tag, ArrowRight, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TopicsPage() {
  const router = useRouter();
  const { token, updateUser } = useStore();

  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);

  // Modal / Creator States
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  
  // Forms
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicCat, setTopicCat] = useState('Computer Science');
  
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');

  // OCR Upload States
  const [ocrLoading, setOcrLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Auto redirect if token missing
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token]);

  const loadTopics = (autoSelectTopicId?: string) => {
    if (token) {
      setLoading(true);
      api.get('/topic')
        .then((res: any[]) => {
          setTopics(res);
          if (res.length > 0) {
            // Find topic to keep active
            const current = autoSelectTopicId 
              ? res.find(t => t.id === autoSelectTopicId) 
              : res[0];
            setSelectedTopic(current || res[0]);
            
            // Auto select note
            const notes = current?.notes || res[0].notes || [];
            if (notes.length > 0) {
              setSelectedNote(notes[0]);
            } else {
              setSelectedNote(null);
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadTopics();
  }, [token]);

  // Create Manual Topic
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/topic', {
        title: topicTitle,
        description: topicDesc,
        category: topicCat,
      });

      confetti({ particleCount: 40, spread: 30 });
      setMessage(`Topic "${res.title}" logged successfully!`);
      setShowTopicModal(false);
      setTopicTitle('');
      setTopicDesc('');
      setTimeout(() => setMessage(''), 3000);
      loadTopics(res.id);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create Note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) return;
    setLoading(true);

    try {
      const res = await api.post('/topic/note', {
        topicId: selectedTopic.id,
        title: noteTitle,
        content: noteContent,
        tags: noteTags,
      });

      confetti({ particleCount: 30, spread: 20 });
      setMessage(`Note "${res.title}" added to topic!`);
      setShowNoteModal(false);
      setNoteTitle('');
      setNoteContent('');
      setNoteTags('');
      setTimeout(() => setMessage(''), 3000);
      loadTopics(selectedTopic.id);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Image OCR processing
  const handleImageOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setMessage('Reading notebook image via AI OCR Engine (Tesseract)...');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result as string;

      try {
        const res = await api.post('/topic/ocr', {
          base64Image,
          fileName: file.name,
        });

        confetti({ particleCount: 100, spread: 80 });
        setMessage(`Success! Notebook OCR scanned: Topic "${res.topic.title}" logged (+50 XP, +20 Coins).`);
        setTimeout(() => setMessage(''), 5000);
        
        // Refresh User Gold & Level
        const profile = await api.get('/auth/profile');
        updateUser(profile);

        loadTopics(res.topic.id);
      } catch (err: any) {
        console.error(err);
        setMessage(`❌ OCR Error: ${err.message}`);
        setTimeout(() => setMessage(''), 5000);
      } finally {
        setOcrLoading(false);
      }
    };
  };

  if (loading && topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-cozy-lavender border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 mt-2">Opening notes folders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-[#F3EFE6]">Topics & Notebook logs 📁</h2>
          <p className="text-xs text-gray-500 mt-1">
            Track study concepts, write study journals, and scan handwritten pages using built-in Tesseract.js.
          </p>
        </div>

        {message && (
          <div className="bg-cozy-mint px-4 py-2 border border-cozy-mint-dark rounded-xl text-xs font-bold animate-pulse text-cozy-mint-deep">
            {message}
          </div>
        )}

        {/* Action controllers */}
        <div className="flex space-x-3">
          {/* File OCR Loader */}
          <label className="px-4 py-2.5 bg-cozy-sky text-cozy-sky-deep font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow cursor-pointer hover:bg-cozy-sky-dark active:scale-95 transition-all">
            <Upload size={14} />
            <span>{ocrLoading ? 'Scanning...' : 'OCR Scan Notebook'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageOCRUpload}
              disabled={ocrLoading}
            />
          </label>

          <button
            onClick={() => setShowTopicModal(true)}
            className="px-4 py-2.5 bg-cozy-lavender text-cozy-lavender-deep font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow cursor-pointer hover:bg-cozy-lavender-dark active:scale-95 transition-all"
          >
            <Plus size={14} />
            <span>New Topic</span>
          </button>
        </div>
      </div>

      {/* CORE SPLIT GRID */}
      {topics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* COL 1: TOPIC DIRECTORIES */}
          <div className="glass-card p-4 space-y-2 md:col-span-1 border-r border-gray-100 pr-4">
            <h3 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest px-2 mb-2">Logged Topics</h3>
            
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {topics.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTopic(t);
                    setSelectedNote(t.notes?.[0] || null);
                  }}
                  className={`p-3 rounded-xl cursor-pointer text-xs font-bold transition-all relative ${
                    selectedTopic?.id === t.id
                      ? 'bg-cozy-lavender text-cozy-lavender-deep shadow-cozyInner'
                      : 'hover:bg-gray-100 dark:hover:bg-black/20 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <p className="truncate">📁 {t.title}</p>
                  <span className="text-[9px] text-gray-400 font-normal">{t.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* COL 2: ASSOCIATED NOTES LIST */}
          <div className="glass-card p-4 space-y-2 md:col-span-1">
            <div className="flex items-center justify-between px-2 mb-2 border-b border-gray-100 pb-2">
              <h3 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">Outline Pages</h3>
              {selectedTopic && (
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="text-cozy-lavender-deep hover:underline text-[10px] font-bold"
                >
                  + Add Note
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
              {selectedTopic?.notes?.map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNote(n)}
                  className={`p-3 rounded-xl cursor-pointer text-xs font-bold transition-all ${
                    selectedNote?.id === n.id
                      ? 'bg-cozy-sky/40 text-cozy-sky-deep'
                      : 'hover:bg-gray-100 dark:hover:bg-black/20 text-gray-500'
                  }`}
                >
                  📄 {n.title}
                </div>
              ))}

              {(!selectedTopic || !selectedTopic.notes || selectedTopic.notes.length === 0) && (
                <p className="text-[10px] text-gray-400 italic text-center py-8">No pages created yet.</p>
              )}
            </div>
          </div>

          {/* COL 3: CONTENT RENDERER */}
          <div className="glass-card p-6 md:col-span-2 space-y-4 min-h-[350px] flex flex-col justify-between">
            {selectedNote ? (
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-800 dark:text-[#F3EFE6]">{selectedNote.title}</h3>
                    {selectedNote.tags && (
                      <span className="inline-flex items-center text-[9px] bg-cozy-lavender/30 text-cozy-lavender-deep font-bold px-2 py-0.5 rounded-full mt-1">
                        <Tag size={8} className="mr-1" />
                        {selectedNote.tags}
                      </span>
                    )}
                  </div>

                  {/* Active study tracker direct redirect */}
                  <button
                    onClick={() => router.push(`/session?topicId=${selectedTopic.id}`)}
                    className="px-3.5 py-1.5 bg-cozy-mint text-cozy-mint-deep hover:bg-cozy-mint-dark rounded-xl text-xs font-extrabold flex items-center space-x-1"
                  >
                    <span>Study Now</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto bg-gray-50 dark:bg-black/10 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  {selectedNote.content}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-gray-400 italic py-16">
                <BookOpen size={36} className="text-gray-300 mb-2 animate-float" />
                Select or write a study outline note to view concepts.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-xs text-gray-500 italic max-w-md mx-auto">
          🌸 Your Study Library is empty.<br/>Upload a notebook image to perform AI OCR, or create a manual topic file folder to start!
        </div>
      )}

      {/* TOPIC CREATOR MODAL */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 relative animate-float">
            <h3 className="text-lg font-bold text-gray-800 dark:text-[#F3EFE6] mb-4">Log New Study Topic 📁</h3>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Topic Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Recursion, Operating Systems"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-850 bg-white/50 text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Category Domain:</label>
                <select
                  value={topicCat}
                  onChange={(e) => setTopicCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="History">History</option>
                  <option value="Literature">Literature</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Short Description (Optional):</label>
                <input
                  type="text"
                  placeholder="Focus goals or outline rules"
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cozy-lavender text-cozy-lavender-deep hover:bg-cozy-lavender-dark text-xs font-bold rounded-xl"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTE CREATOR MODAL */}
      {showNoteModal && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl glass-card p-6 relative animate-float">
            <h3 className="text-lg font-bold text-gray-800 dark:text-[#F3EFE6] mb-4">Add Note to {selectedTopic.title} 📄</h3>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Page Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call Stack mechanics"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Content (Markdown supported):</label>
                <textarea
                  required
                  placeholder="Write your study notes and rules here. The AI Quiz generator uses these outlines."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full p-3 h-32 rounded-xl border border-gray-200 bg-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Tags (Comma-separated):</label>
                <input
                  type="text"
                  placeholder="e.g. recursion, memory"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cozy-sky text-cozy-sky-deep hover:bg-cozy-sky-dark text-xs font-bold rounded-xl"
                >
                  Add Outline Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
