import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { getMonthlyAnalytics, getCategoryAnalytics, getBudget, setBudget } from '../services/analyticsService';
import { getExpenses } from '../services/expenseService';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import BudgetAlert from '../components/BudgetAlert';
import InsightCard from '../components/InsightCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Dashboard = () => {
  const { user } = useAuth();
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState(null);
  const [category, setCategory] = useState(null);
  const [budget, setBudgetData] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [budgetInput, setBudgetInput] = useState('');
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [monthlyRes, categoryRes, expensesRes] = await Promise.all([
        getMonthlyAnalytics(month, year),
        getCategoryAnalytics(month, year),
        getExpenses({ page: 0, size: 5, sortBy: 'date', sortDir: 'desc' }),
      ]);
      setMonthly(monthlyRes.data);
      setCategory(categoryRes.data);
      setRecentExpenses(expensesRes.data?.content || []);

      try {
        const budgetRes = await getBudget(month, year);
        setBudgetData(budgetRes.data);
      } catch {
        setBudgetData(null);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (!budgetInput || isNaN(budgetInput) || Number(budgetInput) <= 0) {
      toast.error('Enter a valid budget amount');
      return;
    }
    try {
      await setBudget({ amount: Number(budgetInput), month, year });
      toast.success('Budget set successfully!');
      setShowBudgetForm(false);
      setBudgetInput('');
      loadData();
    } catch {
      toast.error('Failed to set budget');
    }
  };

  const chartData = {
    labels: monthly?.monthlyData?.map(d => d.month) || MONTHS,
    datasets: [{
      label: 'Monthly Spending (₹)',
      data: monthly?.monthlyData?.map(d => d.amount) || [],
      backgroundColor: 'rgba(102, 126, 234, 0.7)',
      borderColor: '#667eea',
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { callback: (v) => '₹' + v.toLocaleString() },
      },
      x: { grid: { display: false } },
    },
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const totalSpent = Number(monthly?.totalSpent || 0);
  const budgetAmt = Number(monthly?.budget || 0);
  const allInsights = [...(monthly?.insights || [])];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">{MONTHS[month - 1]} {year} — Here's your financial overview</p>
        </div>
        <Link to="/expenses/add" className="btn-primary">+ Add Expense</Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          title="Total Spent This Month"
          value={`₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon="💸"
          color="#667eea"
        />
        <StatCard
          title="Monthly Budget"
          value={budgetAmt > 0 ? `₹${budgetAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Not Set'}
          icon="🎯"
          color="#4caf50"
          subtitle={budgetAmt > 0 ? null : 'Click to set budget'}
        />
        <StatCard
          title="Remaining Budget"
          value={budgetAmt > 0 ? `₹${Math.max(0, budgetAmt - totalSpent).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
          icon="💰"
          color={monthly?.budgetExceeded ? '#f44336' : '#ff9800'}
        />
        <StatCard
          title="Top Category"
          value={category?.highestCategory || 'N/A'}
          icon="📂"
          color="#9c27b0"
          subtitle={category?.categories?.[0] ? `₹${Number(category.categories[0].amount).toLocaleString('en-IN')}` : null}
        />
      </div>

      <div className="dashboard-grid">
        {/* Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Monthly Spending — {year}</h3>
          </div>
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Right column */}
        <div className="dashboard-right">
          {/* Budget */}
          <div className="card">
            <div className="card-header">
              <h3>Budget Status</h3>
              <button className="btn-link" onClick={() => setShowBudgetForm(!showBudgetForm)}>
                {budget ? 'Update' : 'Set Budget'}
              </button>
            </div>
            {showBudgetForm && (
              <form onSubmit={handleSetBudget} className="budget-form">
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="Enter budget amount (₹)"
                  min="1"
                  step="0.01"
                  aria-label="Budget amount"
                />
                <button type="submit" className="btn-primary btn-sm">Save</button>
              </form>
            )}
            {budget ? (
              <BudgetAlert budget={budget} />
            ) : (
              <p className="empty-state-sm">No budget set for this month</p>
            )}
          </div>

          {/* Insights */}
          {allInsights.length > 0 && <InsightCard insights={allInsights} />}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Expenses</h3>
          <Link to="/expenses" className="btn-link">View All →</Link>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="empty-state">
            <p>No expenses yet. <Link to="/expenses/add">Add your first expense</Link></p>
          </div>
        ) : (
          <div className="expense-list">
            {recentExpenses.map((exp) => (
              <div key={exp.id} className="expense-item">
                <div className="expense-icon">{getCategoryIcon(exp.category)}</div>
                <div className="expense-info">
                  <span className="expense-title">{exp.title}</span>
                  <span className="expense-meta">{exp.category} • {exp.date}</span>
                </div>
                <span className="expense-amount">₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const getCategoryIcon = (cat) => {
  const icons = {
    FOOD: '🍔', TRAVEL: '✈️', SHOPPING: '🛍️', BILLS: '📄',
    ENTERTAINMENT: '🎬', HEALTH: '💊', EDUCATION: '📚',
    HOUSING: '🏠', TRANSPORT: '🚗', OTHER: '📦',
  };
  return icons[cat] || '📦';
};

export default Dashboard;
