import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { getMonthlyAnalytics, getCategoryAnalytics, getTrends, exportExcel, exportPdf } from '../services/analyticsService';
import InsightCard from '../components/InsightCard';
import BudgetAlert from '../components/BudgetAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import './Analytics.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
);

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CATEGORY_COLORS = ['#667eea','#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#ffeaa7','#dda0dd','#98d8c8','#f7dc6f','#82e0aa'];

const Analytics = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState(null);
  const [category, setCategory] = useState(null);
  const [trends, setTrends] = useState(null);
  const [exporting, setExporting] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [monthlyRes, categoryRes, trendsRes] = await Promise.all([
        getMonthlyAnalytics(month, year),
        getCategoryAnalytics(month, year),
        getTrends(month, year),
      ]);
      setMonthly(monthlyRes.data);
      setCategory(categoryRes.data);
      setTrends(trendsRes.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const res = type === 'excel' ? await exportExcel(month, year) : await exportPdf(month, year);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses_${month}_${year}.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} exported successfully!`);
    } catch {
      toast.error(`Failed to export ${type}`);
    } finally {
      setExporting('');
    }
  };

  // Bar chart - monthly spending
  const barData = {
    labels: monthly?.monthlyData?.map(d => d.month) || [],
    datasets: [{
      label: 'Spending (₹)',
      data: monthly?.monthlyData?.map(d => Number(d.amount)) || [],
      backgroundColor: monthly?.monthlyData?.map((_, i) =>
        i === month - 1 ? '#667eea' : 'rgba(102,126,234,0.4)'
      ) || [],
      borderColor: '#667eea',
      borderWidth: 1,
      borderRadius: 6,
    }],
  };

  // Pie chart - categories
  const pieData = {
    labels: category?.categories?.map(c => c.category) || [],
    datasets: [{
      data: category?.categories?.map(c => Number(c.amount)) || [],
      backgroundColor: CATEGORY_COLORS,
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  // Line chart - daily trends
  const lineData = {
    labels: trends?.dailyTrends?.map(d => d.label) || [],
    datasets: [{
      label: 'Daily Spending (₹)',
      data: trends?.dailyTrends?.map(d => Number(d.amount)) || [],
      borderColor: '#667eea',
      backgroundColor: 'rgba(102,126,234,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#667eea',
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: v => '₹' + v.toLocaleString() } },
      x: { grid: { display: false } },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'right', labels: { font: { size: 12 }, padding: 16 } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ₹${Number(ctx.raw).toLocaleString('en-IN')} (${category?.categories?.[ctx.dataIndex]?.percentage}%)`,
        },
      },
    },
  };

  const allInsights = [...(monthly?.insights || []), ...(trends?.insights || [])];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="page-subtitle">Deep dive into your spending patterns</p>
        </div>
        <div className="analytics-controls">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} aria-label="Select month">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} aria-label="Select year">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            className="btn-export excel"
            onClick={() => handleExport('excel')}
            disabled={exporting === 'excel'}
            aria-label="Export to Excel"
          >
            {exporting === 'excel' ? '...' : '📊 Excel'}
          </button>
          <button
            className="btn-export pdf"
            onClick={() => handleExport('pdf')}
            disabled={exporting === 'pdf'}
            aria-label="Export to PDF"
          >
            {exporting === 'pdf' ? '...' : '📄 PDF'}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading analytics..." />
      ) : (
        <>
          {/* Summary Stats */}
          <div className="analytics-stats">
            <div className="analytics-stat">
              <span className="stat-label">Total Spent</span>
              <span className="stat-val">₹{Number(monthly?.totalSpent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="analytics-stat">
              <span className="stat-label">Budget</span>
              <span className="stat-val">{monthly?.budget > 0 ? `₹${Number(monthly.budget).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Not Set'}</span>
            </div>
            <div className="analytics-stat">
              <span className="stat-label">Top Category</span>
              <span className="stat-val">{category?.highestCategory || 'N/A'}</span>
            </div>
            <div className="analytics-stat">
              <span className="stat-label">Predicted Next Month</span>
              <span className="stat-val">₹{Number(trends?.predictedNextMonth || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Budget Alert */}
          {monthly?.budget > 0 && (
            <BudgetAlert budget={{
              amount: monthly.budget,
              spent: monthly.totalSpent,
              remaining: monthly.remaining,
              exceeded: monthly.budgetExceeded,
            }} />
          )}

          {/* Charts Row 1 */}
          <div className="charts-grid-2">
            <div className="card">
              <div className="card-header">
                <h3>📊 Monthly Spending — {year}</h3>
              </div>
              <Bar data={barData} options={chartOptions} />
            </div>
            <div className="card">
              <div className="card-header">
                <h3>🥧 Category Breakdown — {MONTHS[month - 1]}</h3>
              </div>
              {category?.categories?.length > 0 ? (
                <Pie data={pieData} options={pieOptions} />
              ) : (
                <div className="no-data">No expense data for this month</div>
              )}
            </div>
          </div>

          {/* Line Chart */}
          <div className="card">
            <div className="card-header">
              <h3>📈 Daily Spending Trend — {MONTHS[month - 1]} {year}</h3>
            </div>
            {trends?.dailyTrends?.length > 0 ? (
              <Line data={lineData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
            ) : (
              <div className="no-data">No daily trend data available</div>
            )}
          </div>

          {/* Weekly Trends */}
          {trends?.weeklyTrends?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>📅 Weekly Breakdown</h3>
              </div>
              <div className="weekly-grid">
                {trends.weeklyTrends.map((w, i) => (
                  <div key={i} className="weekly-item">
                    <span className="weekly-label">{w.label}</span>
                    <div className="weekly-bar-wrap">
                      <div
                        className="weekly-bar"
                        style={{
                          width: `${(Number(w.amount) / Math.max(...trends.weeklyTrends.map(x => Number(x.amount)))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="weekly-amount">₹{Number(w.amount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Table */}
          {category?.categories?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>Category Details</h3>
              </div>
              <table className="category-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Percentage</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {category.categories.map((cat, i) => (
                    <tr key={cat.category}>
                      <td>
                        <span className="cat-dot" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        {cat.category}
                      </td>
                      <td>₹{Number(cat.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>{cat.percentage}%</td>
                      <td>
                        <div className="mini-bar">
                          <div className="mini-bar-fill" style={{ width: `${cat.percentage}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Insights */}
          {allInsights.length > 0 && <InsightCard insights={allInsights} />}
        </>
      )}
    </div>
  );
};

export default Analytics;
