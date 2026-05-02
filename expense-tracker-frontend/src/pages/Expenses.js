import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getExpenses, deleteExpense } from '../services/expenseService';
import LoadingSpinner from '../components/LoadingSpinner';
import './Expenses.css';

const CATEGORIES = ['FOOD','TRAVEL','SHOPPING','BILLS','ENTERTAINMENT','HEALTH','EDUCATION','HOUSING','TRANSPORT','OTHER'];

const getCategoryIcon = (cat) => {
  const icons = { FOOD:'🍔',TRAVEL:'✈️',SHOPPING:'🛍️',BILLS:'📄',ENTERTAINMENT:'🎬',HEALTH:'💊',EDUCATION:'📚',HOUSING:'🏠',TRANSPORT:'🚗',OTHER:'📦' };
  return icons[cat] || '📦';
};

const getCategoryColor = (cat) => {
  const colors = { FOOD:'#ff6b6b',TRAVEL:'#4ecdc4',SHOPPING:'#45b7d1',BILLS:'#96ceb4',ENTERTAINMENT:'#ffeaa7',HEALTH:'#dda0dd',EDUCATION:'#98d8c8',HOUSING:'#f7dc6f',TRANSPORT:'#82e0aa',OTHER:'#aab7b8' };
  return colors[cat] || '#aab7b8';
};

const Expenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalPages: 0, totalElements: 0 });
  const [filters, setFilters] = useState({ category: '', startDate: '', endDate: '', minAmount: '', maxAmount: '' });
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [deleteId, setDeleteId] = useState(null);

  const loadExpenses = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const params = {
        page,
        size: pagination.size,
        sortBy,
        sortDir,
        ...(filters.category && { category: filters.category }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.minAmount && { minAmount: filters.minAmount }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount }),
      };
      const res = await getExpenses(params);
      setExpenses(res.data?.content || []);
      setPagination(prev => ({
        ...prev,
        page,
        totalPages: res.data?.totalPages || 0,
        totalElements: res.data?.totalElements || 0,
      }));
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortDir, pagination.size]);

  useEffect(() => { loadExpenses(0); }, [filters, sortBy, sortDir]);

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      toast.success('Expense deleted');
      setDeleteId(null);
      loadExpenses(pagination.page);
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ category: '', startDate: '', endDate: '', minAmount: '', maxAmount: '' });
  };

  const hasFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="expenses-page">
      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <p className="page-subtitle">{pagination.totalElements} total expenses</p>
        </div>
        <Link to="/expenses/add" className="btn-primary">+ Add Expense</Link>
      </div>

      {/* Filters */}
      <div className="card filters-card">
        <div className="filters-grid">
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange} aria-label="Filter by category">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>From Date</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} aria-label="Start date" />
          </div>
          <div className="form-group">
            <label>To Date</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} aria-label="End date" />
          </div>
          <div className="form-group">
            <label>Min Amount</label>
            <input type="number" name="minAmount" value={filters.minAmount} onChange={handleFilterChange} placeholder="₹ Min" min="0" aria-label="Minimum amount" />
          </div>
          <div className="form-group">
            <label>Max Amount</label>
            <input type="number" name="maxAmount" value={filters.maxAmount} onChange={handleFilterChange} placeholder="₹ Max" min="0" aria-label="Maximum amount" />
          </div>
          <div className="form-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort by">
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
        <div className="filters-actions">
          <select value={sortDir} onChange={e => setSortDir(e.target.value)} className="sort-dir" aria-label="Sort direction">
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
          {hasFilters && (
            <button className="btn-outline" onClick={clearFilters}>Clear Filters</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner text="Loading expenses..." />
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <p>No expenses found</p>
            <Link to="/expenses/add" className="btn-primary">Add your first expense</Link>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id}>
                      <td>
                        <div className="expense-title-cell">
                          <span className="cat-icon">{getCategoryIcon(exp.category)}</span>
                          <div>
                            <div className="exp-name">{exp.title}</div>
                            {exp.description && <div className="exp-desc">{exp.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-badge" style={{ background: getCategoryColor(exp.category) + '25', color: getCategoryColor(exp.category) }}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="amount-cell">₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="date-cell">{exp.date}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon edit" onClick={() => navigate(`/expenses/edit/${exp.id}`)} title="Edit" aria-label="Edit expense">✏️</button>
                          <button className="btn-icon delete" onClick={() => setDeleteId(exp.id)} title="Delete" aria-label="Delete expense">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={pagination.page === 0}
                  onClick={() => loadExpenses(pagination.page - 1)}
                  aria-label="Previous page"
                >← Prev</button>
                <span className="page-info">Page {pagination.page + 1} of {pagination.totalPages}</span>
                <button
                  className="page-btn"
                  disabled={pagination.page >= pagination.totalPages - 1}
                  onClick={() => loadExpenses(pagination.page + 1)}
                  aria-label="Next page"
                >Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete">
          <div className="modal">
            <h3>Delete Expense</h3>
            <p>Are you sure you want to delete this expense? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
