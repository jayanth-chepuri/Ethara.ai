import React from 'react';
import './InsightCard.css';

const InsightCard = ({ insights = [] }) => {
  if (!insights.length) return null;

  return (
    <div className="insight-card">
      <div className="insight-header">
        <span className="insight-icon">💡</span>
        <h3>Smart Insights</h3>
      </div>
      <ul className="insight-list">
        {insights.map((insight, idx) => (
          <li key={idx} className="insight-item">
            <span className="insight-bullet">→</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InsightCard;
