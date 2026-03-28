import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Target, ArrowUpRight, ArrowDownRight, Receipt, Trash2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Expense, Budget } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budget[];
  onDeleteExpense: (id: string) => Promise<void>;
}

const TAG_COLORS = ['#E76F51', '#3A86FF', '#FF006E', '#8338EC', '#06D6A0', '#EF476F', '#118AB2', '#FFD166', '#2A9D8F', '#43AA8B'];

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? '#8D99AE';
}

export default function Dashboard({ expenses, budgets, onDeleteExpense }: DashboardProps) {
  const incomeTransactions = expenses.filter(e => e.category === 'Money Received' || e.tags.includes('#money-received'));
  const expenseTransactions = expenses.filter(e => !(e.category === 'Money Received' || e.tags.includes('#money-received')));

  const totalIncome = incomeTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalIncome - totalExpenses;
  const totalBudget = budgets.reduce((acc, curr) => acc + curr.amount, 0);

  // Aggregate duplicate budget categories so the chart/legend shows each category only once.
  const categoryData = Object.values(
    budgets.reduce((acc: Record<string, { name: string; value: number; budget: number }>, budget) => {
      if (!acc[budget.category]) {
        acc[budget.category] = { name: budget.category, value: 0, budget: 0 };
      }

      const spent = expenseTransactions
        .filter(e => e.category === budget.category)
        .reduce((sum, curr) => sum + curr.amount, 0);

      acc[budget.category].value = spent;
      acc[budget.category].budget += budget.amount;
      return acc;
    }, {})
  );

  const recentExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const tagData = expenseTransactions.reduce((acc: { [key: string]: number }, curr) => {
    curr.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + curr.amount;
    });
    return acc;
  }, {});

  const sortedTags = Object.entries(tagData)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  const topTags = sortedTags.slice(0, 6);
  const totalTagSpending = Object.values(tagData).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total"
          value={`₹${netBalance.toLocaleString()}`}
          trend={netBalance >= 0 ? "Positive" : "Negative"}
          trendUp={netBalance >= 0}
          tone={0}
          icon={Wallet}
        />
        <StatCard
          title="Total Money Received"
          value={`₹${totalIncome.toLocaleString()}`}
          trend="This Month"
          trendUp={true}
          tone={1}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Money Transfer"
          value={`₹${totalExpenses.toLocaleString()}`}
          trend={`${totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0}% of budget`}
          trendUp={totalExpenses <= totalBudget}
          tone={2}
          icon={TrendingDown}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spent by Category */}
        <div className="section-card section-hover p-8 relative overflow-hidden">
          {/* Subtle gradient background accent */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-gradient-to-br from-[#E76F51]/20 via-[#3A86FF]/10 to-transparent blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-gradient-to-tr from-[#06D6A0]/15 to-transparent blur-3xl"></div>
          </div>

          <div className="relative z-10 flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#eef1ff]">Spent by Category</h3>
              <p className="text-xs text-[#acade7] mt-1">Smart visual split by budget category</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#272264] flex items-center justify-center text-[#8f98ff]">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="h-[320px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="42%"
                  innerRadius={62}
                  outerRadius={106}
                  stroke="#f8fcf8"
                  strokeWidth={3}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.filter(item => item.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '14px',
                    border: '1px solid #4f4797',
                    boxShadow: '0 10px 22px -12px rgba(5, 4, 26, 0.85)',
                    backgroundColor: '#161348'
                  }}
                  itemStyle={{ color: '#eef1ff' }}
                  labelStyle={{ color: '#acade7' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Spent']}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ paddingTop: 8 }}
                  formatter={(value) => (
                    <span style={{ color: '#b8b9ea', fontSize: 11, fontWeight: 700, letterSpacing: 0.2 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spent by Tag */}
        <div className="section-card section-hover p-8 relative overflow-hidden">
          {/* Subtle gradient background accent */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-gradient-to-br from-[#3A86FF]/20 via-[#FF006E]/10 to-transparent blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-gradient-to-tr from-[#8338EC]/15 to-transparent blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-[#eef1ff] mb-1">Spent by Tag</h3>
            <p className="text-xs text-[#acade7] mb-6">Tag-wise expense distribution</p>
          </div>
          <div className="h-[300px] relative z-10">
            {topTags.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTags} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" fontSize={10} width={80} tick={{ fill: '#b8b9ea' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #4f4797', backgroundColor: '#161348', boxShadow: '0 8px 20px rgba(0,0,0,0.45)' }}
                    itemStyle={{ color: '#eef1ff' }}
                    labelStyle={{ color: '#acade7' }}
                    formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Spent']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Spent">
                    {topTags.map((_, index) => (
                      <Cell key={`tag-bar-${index}`} fill={TAG_COLORS[index % TAG_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[#9796cf] text-sm">No tags found in expenses.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tag Insights & Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-gradient-to-br from-[#3b2ea3] via-[#5a3fd1] to-[#1a9fff] p-8 rounded-3xl text-white border border-[#6559cc] shadow-lg shadow-[#120f3c]/40">
          <h3 className="text-lg font-bold mb-6">Tag Insights</h3>
          <div className="space-y-6">
            <div>
              <p className="text-xs text-[#e1dcff] uppercase tracking-widest font-bold mb-1">Most Expensive Tag</p>
              <p className="text-2xl font-bold">{topTags[0]?.name || 'N/A'}</p>
              <p className="text-sm text-[#e8e5ff] mt-1">₹{topTags[0]?.value.toLocaleString() || '0'} total</p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="text-xs text-[#e1dcff] uppercase tracking-widest font-bold mb-1">Unique Tags Used</p>
              <p className="text-2xl font-bold">{sortedTags.length}</p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="text-xs text-[#e1dcff] uppercase tracking-widest font-bold mb-1">Avg. Spent per Tag</p>
              <p className="text-2xl font-bold">
                ₹{sortedTags.length > 0 ? (totalTagSpending / sortedTags.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 section-card section-hover p-8">
          <h3 className="text-lg font-bold text-[#eef1ff] mb-6">Tag Breakdown</h3>
          <div className="overflow-y-auto max-h-[300px] pr-2 scrollbar-hide">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#3a367f]">
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#aeb1ed]">Tag Name</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#aeb1ed]">Total Spent</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#aeb1ed]">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b2863]">
                {sortedTags.map((tag) => (
                  <tr key={tag.name} className="group hover:bg-[#201d56] transition-colors">
                    <td className="py-4">
                      <span className="text-sm font-bold text-[#eef1ff] uppercase font-mono bg-[#292461] px-2 py-1 rounded-lg">{tag.name}</span>
                    </td>
                    <td className="py-4 text-sm font-bold text-[#eef1ff]">₹{tag.value.toFixed(2)}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#2f2a6e] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#7b5cff] to-[#2fbbff] rounded-full" 
                            style={{ width: `${(tag.value / totalTagSpending) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#b7b9ea]">
                          {((tag.value / totalTagSpending) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedTags.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-[#a3a5db] text-sm">No tags available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Budget vs Actual */}
        <div className="section-card section-hover p-8">
          <h3 className="text-lg font-bold text-[#eef1ff] mb-6">Budget vs Actual</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#b8b9ea' }} />
                <YAxis fontSize={10} tick={{ fill: '#b8b9ea' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #4f4797', backgroundColor: '#161348' }}
                  itemStyle={{ color: '#eef1ff' }}
                  labelStyle={{ color: '#acade7' }}
                />
                <Bar dataKey="budget" fill="#3f3a83" radius={[4, 4, 0, 0]} name="Budget" />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Actual">
                  {categoryData.map((entry, index) => (
                    <Cell key={`budget-actual-${index}`} fill={getCategoryColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="section-card section-hover p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#eef1ff]">Recent Transactions</h3>
            <button className="text-xs font-semibold text-[#aeb1ed] hover:text-[#f3f4ff] transition-colors uppercase tracking-wider">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#201d56] transition-colors border border-transparent hover:border-[#393583]">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${expense.category === 'Money Received' || expense.tags.includes('#money-received') ? 'bg-[#173b34]' : 'bg-[#28235f]'}`}>
                    <Receipt size={18} className={expense.category === 'Money Received' || expense.tags.includes('#money-received') ? 'text-[#59e7b0]' : 'text-[#c4c5f7]'} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#eef1ff]">{expense.merchant}</p>
                    <p className="text-xs text-[#aeb1ed]">
                      {expense.category} • {new Date(expense.date).toLocaleDateString()}
                      {expense.time && ` • ${expense.time}`}
                      {expense.paymentMethod && ` • ${expense.paymentMethod}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-sm font-bold ${expense.category === 'Money Received' || expense.tags.includes('#money-received') ? 'text-[#59e7b0]' : 'text-[#eef1ff]'}`}>
                      {expense.category === 'Money Received' || expense.tags.includes('#money-received') ? '+' : '-'}₹{expense.amount.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        expense.status === 'completed' ? 'bg-[#173b34] text-[#59e7b0]' : 
                        expense.status === 'pending' ? 'bg-[#3b2f0f] text-[#ffd36a]' : 
                        'bg-[#4a1c34] text-[#ff9ecb]'
                      }`}>
                        {expense.status || 'completed'}
                      </span>
                      <div className="flex gap-1">
                        {expense.tags.filter(tag => tag.startsWith('#')).map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#2b2665] text-[#b8b9ea] rounded uppercase font-mono">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDeleteExpense(expense.id)}
                    className="p-2 text-[#a8a9e7] hover:text-[#ff9ecb] hover:bg-[#4a1c34] rounded-xl transition-all"
                    title="Delete Expense"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {recentExpenses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#a3a5db] text-sm">No recent transactions found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, trendUp, tone = 0, icon: Icon }: any) {
  const cardTones = [
    {
      wrapper: 'bg-gradient-to-r from-[#3f37c9] to-[#5a4ff0] border-[#6762d7]',
      iconWrap: 'bg-[#5a53d6]',
      icon: 'text-[#dcddff]'
    },
    {
      wrapper: 'bg-gradient-to-r from-[#13a6d4] to-[#25c3e7] border-[#41caea]',
      iconWrap: 'bg-[#0d84aa]',
      icon: 'text-[#d8f7ff]'
    },
    {
      wrapper: 'bg-gradient-to-r from-[#8e2de2] via-[#b5179e] to-[#d63384] border-[#bf4dc0]',
      iconWrap: 'bg-[#8f2f9c]',
      icon: 'text-[#ffe2ff]'
    }
  ];
  const toneStyle = cardTones[tone % cardTones.length];

  return (
    <div className={`p-8 rounded-3xl border shadow-sm hover:shadow-md transition-shadow ${toneStyle.wrapper}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${toneStyle.iconWrap}`}>
          <Icon size={24} className={toneStyle.icon} />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          trendUp ? "bg-[#1a5138]/80 text-[#aefbd6]" : "bg-[#5f2137]/80 text-[#ffc2de]"
        )}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <p className="text-sm font-medium text-[#eef1ff]/80 mb-1">{title}</p>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
