import React, { useState } from 'react';
import { BookOpen, Search, Filter, ArrowRight, Bookmark, Clock, Sparkles, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';
import { LITERACY_ARTICLES } from '../constants';
import { LiteracyArticle } from '../types';

export default function Literacy() {
  const [selectedArticle, setSelectedArticle] = useState<LiteracyArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [coachInput, setCoachInput] = useState('');
  const [coachResponse, setCoachResponse] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  const filteredArticles = LITERACY_ARTICLES.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const askCoach = async (question: string) => {
    setIsCoachLoading(true);
    setCoachResponse(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: "You are a friendly and expert AI Finance Coach. Provide concise, practical, and accurate financial advice. Use Indian Rupees (₹) as the primary currency in your examples and advice. Use markdown for formatting. If the user asks something unrelated to finance, politely redirect them. Question: " + question }
            ]
          }
        ]
      });
      setCoachResponse(response.text);
    } catch (err) {
      console.error('Coach Error:', err);
      setCoachResponse("I'm sorry, I'm having trouble connecting right now. Please try again later.");
    } finally {
      setIsCoachLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8dc9]" size={18} />
          <input
            type="text"
            placeholder="Search financial topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a174c] border border-[#3f3a90] rounded-2xl pl-12 pr-4 py-3 text-sm font-medium text-[#eef1ff] placeholder:text-[#8b8dc9] focus:outline-none focus:ring-2 focus:ring-[#7b5cff]/40 focus:border-[#7b5cff] transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['all', 'budgeting', 'investing', 'saving', 'debt'].map(cat => (
            <button
              key={cat}
              className="px-4 py-2 rounded-xl bg-[#1a174c] border border-[#3f3a90] text-xs font-bold text-[#b8b9ea] hover:bg-[#262162] hover:text-[#eef1ff] transition-colors whitespace-nowrap capitalize"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredArticles.map((article) => (
              <motion.div
                layout
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedArticle(article as LiteracyArticle)}
                className="group section-card section-hover p-8 rounded-3xl border border-[#3f3a90] shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-[#292461] text-[#b8b9ea] text-[10px] font-bold uppercase tracking-widest border border-[#4842a4]">
                    {article.category}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[#9ea1df] font-mono uppercase tracking-widest">
                    <Clock size={12} />
                    {article.readTime}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#eef1ff] mb-3 group-hover:text-[#d9dbff] transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-[#b8b9ea] line-clamp-2 mb-6 leading-relaxed">
                  {article.content}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-[#2d2869]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#eef1ff]">
                    Read Article
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                  <button className="p-2 text-[#aeb1ed] hover:text-[#eef1ff] transition-colors">
                    <Bookmark size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Sidebar / AI Coach */}
        <div className="space-y-6">
          <div className="section-card p-8 rounded-3xl text-white shadow-xl shadow-[#120f3c]/45 border border-[#3f3a90]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#262162] flex items-center justify-center border border-[#4842a4]">
                <Sparkles size={20} className="text-white" />
              </div>
              <h4 className="font-bold text-lg">AI Finance Coach</h4>
            </div>
            
            <div className="space-y-4">
              <div className="max-h-[300px] overflow-y-auto space-y-4 mb-4 scrollbar-hide">
                {coachResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-[#c9cbff] leading-relaxed bg-[#1a174c] p-4 rounded-2xl border border-[#3f3a90]"
                  >
                    <ReactMarkdown>{coachResponse}</ReactMarkdown>
                  </motion.div>
                )}
                {isCoachLoading && (
                  <div className="flex items-center gap-2 text-xs text-[#aeb1ed]">
                    <Loader2 size={14} className="animate-spin" />
                    Coach is thinking...
                  </div>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && coachInput && askCoach(coachInput)}
                  className="w-full bg-[#1a174c] border border-[#3f3a90] rounded-xl pl-4 pr-10 py-3 text-xs text-[#eef1ff] placeholder:text-[#8b8dc9] focus:outline-none focus:ring-2 focus:ring-[#7b5cff]/40 focus:border-[#7b5cff] transition-all"
                />
                <button
                  onClick={() => coachInput && askCoach(coachInput)}
                  disabled={!coachInput || isCoachLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#9ea1df] hover:text-white transition-colors disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button 
                  onClick={() => askCoach("How can I save more on dining?")}
                  className="text-[10px] px-2 py-1 rounded-lg bg-[#1a174c] border border-[#3f3a90] hover:bg-[#262162] transition-colors text-[#b8b9ea]"
                >
                  Save on dining?
                </button>
                <button 
                  onClick={() => askCoach("Explain the 50/30/20 rule")}
                  className="text-[10px] px-2 py-1 rounded-lg bg-[#1a174c] border border-[#3f3a90] hover:bg-[#262162] transition-colors text-[#b8b9ea]"
                >
                  50/30/20 rule?
                </button>
              </div>
            </div>
          </div>

          <div className="section-card section-hover p-8 rounded-3xl border border-[#3f3a90] shadow-sm">
            <h4 className="font-bold text-[#eef1ff] mb-4">Popular Topics</h4>
            <div className="flex flex-wrap gap-2">
              {['Tax Savings', 'Credit Score', 'Mortgage', 'ETF', 'Crypto', 'Retirement'].map(topic => (
                <span key={topic} className="px-3 py-1.5 rounded-xl bg-[#1a174c] text-[#b8b9ea] text-[10px] font-bold uppercase tracking-wider border border-[#3f3a90] cursor-pointer hover:bg-[#262162] hover:text-[#eef1ff] transition-colors">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="section-card bg-[#120f3d] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8 md:p-12 relative border border-[#4b44a8]"
            >
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-6 right-6 p-2 text-[#aeb1ed] hover:text-[#eef1ff] transition-colors"
              >
                <ArrowRight className="rotate-180" size={24} />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 rounded-lg bg-[#292461] text-[#b8b9ea] text-xs font-bold uppercase tracking-widest border border-[#4842a4]">
                  {selectedArticle.category}
                </span>
                <span className="text-xs text-[#9ea1df] font-mono uppercase tracking-widest">
                  {selectedArticle.readTime} read
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-[#eef1ff] mb-8 tracking-tight">
                {selectedArticle.title}
              </h2>

              <div className="prose prose-gray max-w-none">
                <div className="text-[#b8b9ea] leading-relaxed space-y-4">
                  <ReactMarkdown>
                    {selectedArticle.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
