import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Receipt, PieChart, BookOpen, LogOut, User, FileText, Tag as TagIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
}

export default function Layout({ children, activeTab, setActiveTab, user, onLogout }: LayoutProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'budget', label: 'Budgeting', icon: PieChart },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'tags', label: 'Tags', icon: TagIcon },
    { id: 'literacy', label: 'Literacy', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-[#151046]/95 to-[#0c0a2d]/95 backdrop-blur-sm border-r border-[#2e2a73] flex flex-col">
        <div className="p-6 border-bottom border-[#2b2870]">
          <h1 className="text-2xl font-bold text-[#eef1ff] tracking-tight">FinTrack AI</h1>
          <p className="text-xs text-[#a8a9e7] font-mono uppercase tracking-widest mt-1">Smart Finance</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === item.id
                  ? "bg-gradient-to-r from-[#7b5cff] via-[#5f5be8] to-[#2fbbff] text-white shadow-lg shadow-[#1a1750]/70"
                  : "text-[#b8b9ea] hover:bg-[#1e1a55] hover:text-[#f3f4ff]"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#2b2870]">
          {user ? (
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="w-10 h-10 rounded-full bg-[#25205e] flex items-center justify-center overflow-hidden ring-1 ring-[#4e47a7]">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-[#b8b9ea]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#eef1ff] truncate">{user.displayName || 'User'}</p>
                <button
                  onClick={onLogout}
                  className="text-xs text-[#ff9bc8] hover:text-[#ffc2df] font-medium flex items-center gap-1 mt-0.5"
                >
                  <LogOut size={12} />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2 text-center">
              <p className="text-xs text-[#a8a9e7] mb-2">Sign in to sync data</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-[#130f3d]/85 backdrop-blur-sm border-b border-[#2e2a73] flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-[#eef1ff] capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-[#acade7]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
