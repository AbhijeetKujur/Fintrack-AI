import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ExpenseUpload from './components/ExpenseUpload';
import Budgeting from './components/Budgeting';
import Literacy from './components/Literacy';
import ManualExpenseForm from './components/ManualExpenseForm';
import SpendingReports from './components/SpendingReports';
import TagManagement from './components/TagManagement';
import ErrorBoundary from './components/ErrorBoundary';
import { Expense, Budget, UserProfile, Tag } from './types';
import { CATEGORIES } from './constants';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, 
  collection, query, where, onSnapshot, addDoc, deleteDoc, doc, setDoc, 
  handleFirestoreError, OperationType 
} from './firebase';
import { LogIn, ShieldAlert, Trash2, Plus, Search } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagFilter, setTagFilter] = useState('');
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Ensure user profile exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user || !isAuthReady) {
      setExpenses([]);
      setBudgets([]);
      return;
    }

    const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', user.uid));
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'expenses');
    });

    const budgetsQuery = query(collection(db, 'budgets'), where('userId', '==', user.uid));
    const unsubscribeBudgets = onSnapshot(budgetsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
      setBudgets(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'budgets');
    });

    const tagsQuery = query(collection(db, 'tags'), where('userId', '==', user.uid));
    const unsubscribeTags = onSnapshot(tagsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
      setTags(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tags');
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeBudgets();
      unsubscribeTags();
    };
  }, [user, isAuthReady]);

  const handleLogin = async () => {
    try {
      // Add scopes for Google Sign-in
      googleProvider.addScope('profile');
      googleProvider.addScope('email');
      
      // Set custom parameters for better UX
      googleProvider.setCustomParameters({
        'prompt': 'consent'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Successfully signed in:', result.user.email);
    } catch (error: any) {
      console.error('Login Error Details:', {
        code: error.code,
        message: error.message,
        email: error.email,
        credential: error.credential,
      });
      
      // Handle specific error cases
      if (error.code === 'auth/popup-blocked') {
        alert('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('Sign-in was cancelled by the user');
      } else if (error.code === 'auth/unauthorized-domain') {
        const host = window.location.hostname;
        alert(
          `This host is not authorized in Firebase.\n\n` +
          `Project: ${firebaseConfig.projectId}\n` +
          `Current host: ${host}\n\n` +
          `In Firebase Console -> Authentication -> Settings -> Authorized domains, add this host only (no port): ${host}`
        );
      } else if (error.code === 'auth/operation-not-allowed') {
        alert('Google Sign-in is not enabled. Please check Firebase configuration.');
      } else if (error.code === 'auth/network-request-failed') {
        alert('Network error. Please check your internet connection and try again.');
      } else {
        alert(`Sign-in failed: ${error.message}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const handleExpensesExtracted = async (dataList: Partial<Expense>[]) => {
    if (!user) return;
    
    const path = 'expenses';
    try {
      const promises = dataList.map(data => 
        addDoc(collection(db, path), {
          date: data.date || new Date().toISOString().split('T')[0],
          time: data.time || '',
          amount: data.amount || 0,
          category: data.category || 'Other',
          description: data.description || '',
          merchant: data.merchant || 'Unknown Merchant',
          tags: data.tags || [],
          paymentMethod: data.paymentMethod || '',
          status: data.status || 'completed',
          userId: user.uid,
          createdAt: new Date().toISOString()
        })
      );
      await Promise.all(promises);
      setActiveTab('expenses');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleAddBudget = async (data: Partial<Budget>) => {
    if (!user) return;
    
    const path = 'budgets';
    try {
      await addDoc(collection(db, path), {
        category: data.category || 'Other',
        amount: data.amount || 0,
        period: 'monthly',
        userId: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    const path = `budgets/${id}`;
    try {
      await deleteDoc(doc(db, 'budgets', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const path = `expenses/${id}`;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      setSelectedExpenseIds(prev => prev.filter(i => i !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleBulkDelete = async () => {
    const path = 'expenses/bulk';
    try {
      const promises = selectedExpenseIds.map(id => deleteDoc(doc(db, 'expenses', id)));
      await Promise.all(promises);
      setSelectedExpenseIds([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleAddTag = async (name: string) => {
    if (!user) return;
    const path = 'tags';
    try {
      await addDoc(collection(db, path), {
        name,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleUpdateTag = async (id: string, name: string) => {
    const path = `tags/${id}`;
    try {
      await setDoc(doc(db, 'tags', id), { name }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDeleteTag = async (id: string) => {
    const path = `tags/${id}`;
    try {
      await deleteDoc(doc(db, 'tags', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleAddExpense = async (data: Partial<Expense>) => {
    if (!user) return;
    
    const path = 'expenses';
    try {
      await addDoc(collection(db, path), {
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || '',
        amount: data.amount || 0,
        category: data.category || 'Other',
        description: data.description || '',
        merchant: data.merchant || 'Manual Entry',
        tags: data.tags || [],
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#11304a] rounded-2xl" />
          <div className="h-4 w-32 bg-[#11304a] rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#8f63f4] via-[#6e46e7] to-[#4f2dbe] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/18 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#b997ff]/28 blur-3xl" />
        </div>

        <div className="relative z-10 bg-gradient-to-br from-[#d8d0f0] via-[#d6d2ef] to-[#cdc5e8] p-12 rounded-[34px] border border-[#c2b9e1] shadow-[0_28px_70px_-30px_rgba(27,10,84,0.75)] max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7a54ef] to-[#6f46ea] text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#6b45dd]/40">
            <ShieldAlert size={40} />
          </div>
          <h1 className="text-3xl font-bold text-[#3a2e69] mb-2 tracking-tight">FinTrack AI</h1>
          <p className="text-[#5d5189] mb-10 leading-relaxed">Securely manage your expenses and budgets with AI-powered insights.</p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#7a54ef] via-[#6f46ea] to-[#5f34dd] text-white py-4 rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-[#5b39c9]/45"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
          <p className="mt-8 text-[10px] text-[#71629f] font-mono uppercase tracking-widest">Enterprise Grade Security</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard expenses={expenses} budgets={budgets} onDeleteExpense={handleDeleteExpense} />;
      case 'expenses':
        const filteredExpenses = tagFilter.trim() === '' 
          ? expenses 
          : expenses.filter(e => e.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase())));

        // Group expenses by month
        const groupedExpenses = filteredExpenses.reduce((groups: Record<string, typeof expenses>, expense) => {
          const date = new Date(expense.date);
          const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
          if (!groups[monthYear]) groups[monthYear] = [];
          groups[monthYear].push(expense);
          return groups;
        }, {});

        // Sort months descending
        const sortedMonths = Object.keys(groupedExpenses).sort((a, b) => {
          return new Date(b).getTime() - new Date(a).getTime();
        });

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ExpenseUpload onExpensesExtracted={handleExpensesExtracted} />
              <ManualExpenseForm onAddExpense={handleAddExpense} availableTags={tags} />
            </div>
            <div className="section-card section-hover p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-bold text-[#1d2a24]">All Transactions</h3>
                  <div className="flex bg-[#ecf2ed] p-1 rounded-xl">
                    <button 
                      onClick={() => setTagFilter('')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${tagFilter === '' ? 'bg-[#fcfcf9] text-[#1e2a25] shadow-sm' : 'text-[#6b766f] hover:text-[#4f5c54]'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setTagFilter('#money-received')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${tagFilter === '#money-received' ? 'bg-[#fcfcf9] text-[#2e8a67] shadow-sm' : 'text-[#6b766f] hover:text-[#4f5c54]'}`}
                    >
                      Received
                    </button>
                  </div>
                  {selectedExpenseIds.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 px-4 py-1.5 bg-[#fff0ef] text-[#b44f48] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#ffe5e3] transition-all border border-[#f1c9c5]"
                    >
                      <Trash2 size={12} />
                      Delete Selected ({selectedExpenseIds.length})
                    </button>
                  )}
                </div>
                <div className="relative w-full md:w-64">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78857d]" />
                  <input
                    type="text"
                    placeholder="Filter by tag (e.g. #food)"
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#f0f5f1] border border-[#d9e4db] rounded-xl text-sm focus:ring-2 focus:ring-[#1f6b55]/30 focus:border-[#90b4a1] transition-all"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#e3ebe4]">
                      <th className="pb-4 pl-4 w-10">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-[#c5d2c8] text-[#1f6b55] focus:ring-[#1f6b55]"
                          checked={filteredExpenses.length > 0 && selectedExpenseIds.length === filteredExpenses.length}
                          onChange={() => {
                            if (selectedExpenseIds.length === filteredExpenses.length) {
                              setSelectedExpenseIds([]);
                            } else {
                              setSelectedExpenseIds(filteredExpenses.map(e => e.id));
                            }
                          }}
                        />
                      </th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#6f7d75]">Date & Time</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#6f7d75]">Merchant</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#6f7d75]">Category</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#6f7d75]">Amount</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#6f7d75]">Payment</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#6f7d75]">Status</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#6f7d75]">Tags</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#6f7d75] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebf1eb]">
                    {sortedMonths.map(monthYear => (
                      <React.Fragment key={monthYear}>
                        <tr className="bg-[#f1f6f2]">
                          <td colSpan={9} className="py-2 px-4 text-[10px] font-bold uppercase tracking-widest text-[#5f6d64]">
                            {monthYear}
                          </td>
                        </tr>
                        {groupedExpenses[monthYear].map((expense) => (
                          <tr key={expense.id} className={`group hover:bg-[#f5faf6] transition-colors ${selectedExpenseIds.includes(expense.id) ? 'bg-[#edf4ef]' : ''}`}>
                            <td className="py-4 pl-4">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-[#bfcdc2] text-[#1f6b55] focus:ring-[#1f6b55]"
                                checked={selectedExpenseIds.includes(expense.id)}
                                onChange={() => {
                                  setSelectedExpenseIds(prev => 
                                    prev.includes(expense.id) 
                                      ? prev.filter(id => id !== expense.id) 
                                      : [...prev, expense.id]
                                  );
                                }}
                              />
                            </td>
                            <td className="py-4">
                              <div className="text-sm text-[#4f5d55]">{new Date(expense.date).toLocaleDateString()}</div>
                              {expense.time && <div className="text-[10px] text-[#7b8880] font-mono">{expense.time}</div>}
                            </td>
                            <td className="py-4 text-sm font-bold text-[#1f2d26]">{expense.merchant}</td>
                            <td className="py-4 text-sm text-[#5f6d65]">{expense.category}</td>
                            <td className="py-4 text-sm font-bold">
                              <span className={expense.category === 'Money Received' || expense.tags.includes('#money-received') ? 'text-[#2d8a67]' : 'text-[#1f2d26]'}>
                                {expense.category === 'Money Received' || expense.tags.includes('#money-received') ? '+' : '-'}₹{expense.amount.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-4 text-xs text-[#5f6d65]">{expense.paymentMethod || '-'}</td>
                            <td className="py-4">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                expense.status === 'completed' ? 'bg-[#e4f4ec] text-[#2d8a67]' : 
                                expense.status === 'pending' ? 'bg-[#fdf3db] text-[#a8791f]' : 
                                'bg-[#fff0ef] text-[#b44f48]'
                              }`}>
                                {expense.status || 'completed'}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex gap-1">
                                {expense.tags.filter(tag => tag.startsWith('#')).map(tag => (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#edf4ef] text-[#5f6d65] rounded uppercase font-mono">{tag}</span>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 text-right pr-4">
                              <button 
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-2 text-[#79877f] hover:text-[#b44f48] hover:bg-[#fff0ef] rounded-xl transition-all"
                                title="Delete Expense"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-[#7a8780] text-sm">No transactions recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'budget':
        return (
          <Budgeting 
            budgets={budgets} 
            expenses={expenses} 
            onAddBudget={handleAddBudget} 
            onDeleteBudget={handleDeleteBudget} 
          />
        );
      case 'literacy':
        return <Literacy />;
      case 'reports':
        return <SpendingReports expenses={expenses} budgets={budgets} />;
      case 'tags':
        return (
          <TagManagement 
            tags={tags} 
            onAddTag={handleAddTag} 
            onUpdateTag={handleUpdateTag} 
            onDeleteTag={handleDeleteTag} 
          />
        );
      default:
        return <Dashboard expenses={expenses} budgets={budgets} onDeleteExpense={handleDeleteExpense} />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout}
      >
        {renderContent()}
      </Layout>
    </ErrorBoundary>
  );
}
