import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createExpense, updateExpense, getExpenseById } from '../services/expenseService';
import LoadingSpinner from '../components/LoadingSpinner';
import './AddEditExpense.css';

const CATEGORIES = ['FOOD','TRAVEL','SHOPPING','BILLS','ENTERTAINMENT','HEALTH','EDUCATION','HOUSING','TRANSPORT','OTHER'];

const getCategoryIcon = (cat) => {
  const icons = { FOOD:'🍔',TRAVEL:'✈️',SHOPPING:'🛍️',BILLS:'📄',ENTERTAINMENT:'🎬',HEALTH:'💊',EDUCATION:'📚',HOUSING:'🏠',TRANSPORT:'🚗',OTHER:'📦' };
  return icons[cat] || '📦';
};

const AddEditExpense = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'FOOD',
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      setFetchLoading(true);
      getExpenseById(id)
        .then(res => {
          const exp = res.data;
          setForm({
            title: exp.title,
            description: exp.description || '',
            amount: exp.amount,
            category: exp.category,
            date: exp.date,
          });
        })
        .catch(() => {
          toast.error('Failed to load expense');
          navigate('/expenses');
        })
        .finally(() => setFetchLoading(false));
    }
  }, [id, isEdit, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) errs.amount = 'Enter a valid positive amount';
    if (!form.category) errs.category = 'Category is required';
    if (!form.date) errs.date = 'Date is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (isEdit) {
        await updateExpense(id, payload);
        toast.success('Expense updated successfully!');
      } else {
        await createExpense(payload);
        toast.success('Expense added successfully!');
      }
      navigate('/expenses');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save expense';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  if (fetchLoading) return <LoadingSpinner text="Loading expense..." />;

  return (
    <div className="add-expense-page">
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Expense' : 'Add New Expense'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update expense details' : 'Record a new expense'}</p>
        </div>
        <Link to="/expenses" className="btn-outline">← Back</Link>
      </div>

      <div className="add-expense-grid">
        <div className="card form-card">
          <form onSubmit={handleSubmit} className="expense-form">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., Lunch at restaurant"
                className={errors.title ? 'error' : ''}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {errors.title && <span id="title-error" className="field-error">{errors.title}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount (₹) *</label>
                <input
                  id="amount"
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className={errors.amount ? 'error' : ''}
                  aria-describedby={errors.amount ? 'amount-error' : undefined}
                />
                {errors.amount && <span id="amount-error" className="field-error">{errors.amount}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="date">Date *</label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className={errors.date ? 'error' : ''}
                  aria-describedby={errors.date ? 'date-error' : undefined}
                />
                {errors.date && <span id="date-error" className="field-error">{errors.date}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Category *</label>
              <div className="category-grid" role="group" aria-label="Select category">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-btn ${form.category === cat ? 'selected' : ''}`}
                    onClick={() => { setForm({ ...form, category: cat }); setErrors({ ...errors, category: '' }); }}
                    aria-pressed={form.category === cat}
                  >
                    <span>{getCategoryIcon(cat)}</span>
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
              {errors.category && <span className="field-error">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Add notes about this expense..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <Link to="/expenses" className="btn-outline">Cancel</Link>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : (isEdit ? 'Update Expense' : 'Add Expense')}
              </button>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="card preview-card">
          <h3>Preview</h3>
          <div className="expense-preview">
            <div className="preview-icon">{getCategoryIcon(form.category)}</div>
            <div className="preview-title">{form.title || 'Expense Title'}</div>
            <div className="preview-amount">₹{form.amount ? Number(form.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</div>
            <div className="preview-meta">
              <span className="preview-category">{form.category}</span>
              <span>•</span>
              <span>{form.date || 'Date'}</span>
            </div>
            {form.description && <div className="preview-desc">{form.description}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditExpense;
