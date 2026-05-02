import React from 'react';
import './BudgetAlert.css';

const BudgetAlert = ({ budget }) => {
  if (!budget) return null;

  const percentage = budget.amount > 0
    ? Math.min((budget.spent / budget.amount) * 100, 100)
    : 0;

  const getStatus = () => {
    if (budget.exceeded) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'safe';
  };

  const status = getStatus();

  return (
    <div className={`budget-alert budget-${status}`}>
      <div className="budget-alert-header">
        <div className="budget-alert-title">
          <span className="budget-icon">
            {status === 'danger' ? '🚨' : status === 'warning' ? '⚠️' : '✅'}
          </span>
          <span>Monthly Budget</span>
        </div>
        <span className="budget-percentage">{percentage.toFixed(1)}% used</span>
      </div>

      <div className="budget-progress-bar">
        <div
          className="budget-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="budget-amounts">
        <span>Spent: ₹{Number(budget.spent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        <span>Budget: ₹{Number(budget.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>

      {budget.exceeded && (
        <div className="budget-exceeded-msg">
          ⚠️ You've exceeded your budget by ₹{Math.abs(Number(budget.remaining || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )}
    </div>
  );
};

export default BudgetAlert;
