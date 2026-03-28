import React, { useState } from 'react';
import { Tag as TagType } from '../types';
import { Plus, Trash2, Edit2, Check, X, Tag as TagIcon, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TagManagementProps {
  tags: TagType[];
  onAddTag: (name: string) => Promise<void>;
  onUpdateTag: (id: string, name: string) => Promise<void>;
  onDeleteTag: (id: string) => Promise<void>;
}

export default function TagManagement({ tags, onAddTag, onUpdateTag, onDeleteTag }: TagManagementProps) {
  const [newTagName, setNewTagName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTag(newTagName.trim().startsWith('#') ? newTagName.trim() : `#${newTagName.trim()}`);
      setNewTagName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (tag: TagType) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onUpdateTag(id, editingName.trim().startsWith('#') ? editingName.trim() : `#${editingName.trim()}`);
      setEditingId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-[#aeb1ed] ml-1';
  const inputWithIconClass = 'w-full pl-10 pr-4 py-3 bg-[#1a174c] border border-[#3f3a90] rounded-2xl text-sm text-[#eef1ff] placeholder:text-[#8b8dc9] focus:ring-2 focus:ring-[#7b5cff]/40 focus:border-[#7b5cff] transition-all';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Tag Form */}
        <div className="lg:col-span-1">
          <div className="section-card section-hover p-8 rounded-3xl border border-[#3f3a90] shadow-sm sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7b5cff] to-[#2fbbff] text-white flex items-center justify-center">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#eef1ff]">New Tag</h3>
                <p className="text-xs text-[#b8b9ea]">Create a custom tag</p>
              </div>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Tag Name</label>
                <div className="relative">
                  <TagIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8dc9]" />
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="e.g. #subscription"
                    className={inputWithIconClass}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!newTagName.trim() || isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-[#7b5cff] via-[#5f5be8] to-[#2fbbff] text-white rounded-2xl font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#1d1858]/70"
              >
                {isSubmitting ? 'Adding...' : 'Add Tag'}
              </button>
            </form>
          </div>
        </div>

        {/* Tag List */}
        <div className="lg:col-span-2">
          <div className="section-card section-hover p-8 rounded-3xl border border-[#3f3a90] shadow-sm min-h-[400px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#262162] flex items-center justify-center text-[#eef1ff]">
                  <TagIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#eef1ff]">Manage Tags</h3>
                  <p className="text-xs text-[#b8b9ea]">{tags.length} custom tags created</p>
                </div>
              </div>
              <div className="relative w-full md:w-64">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8dc9]" />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#1a174c] border border-[#3f3a90] rounded-xl text-sm text-[#eef1ff] placeholder:text-[#8b8dc9] focus:ring-2 focus:ring-[#7b5cff]/40 focus:border-[#7b5cff] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredTags.map((tag) => (
                  <motion.div
                    key={tag.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group flex items-center justify-between p-4 bg-[#1a174c] border border-[#3f3a90] rounded-2xl hover:bg-[#262162] transition-all"
                  >
                    {editingId === tag.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 bg-[#25205e] border border-[#4b44a8] rounded-lg px-2 py-1 text-sm text-[#eef1ff] focus:ring-2 focus:ring-[#7b5cff]/40"
                          autoFocus
                        />
                        <button 
                          onClick={() => handleUpdate(tag.id)}
                          className="p-1.5 text-[#6ef3be] hover:bg-[#174133] rounded-lg"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-[#b8b9ea] hover:bg-[#2f2a70] rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-[#eef1ff] font-mono">{tag.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleStartEdit(tag)}
                            className="p-2 text-[#aeb1ed] hover:text-[#eef1ff] hover:bg-[#2f2a70] rounded-xl transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => onDeleteTag(tag.id)}
                            className="p-2 text-[#aeb1ed] hover:text-[#ff9ecb] hover:bg-[#4a1c34] rounded-xl transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredTags.length === 0 && (
                <div className="col-span-full py-12 text-center text-[#aeb1ed] text-sm">
                  {searchQuery ? 'No tags matching your search.' : 'No custom tags yet.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
