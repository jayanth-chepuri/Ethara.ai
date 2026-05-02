import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, icon, color, subtitle, trend }) => {
  return (
    <div className="stat-card" style={{ '--card-color': color }}>
      <div className="stat-card-header">
        <div className="stat-icon" style={{ background: `${color}20`, color }}>
          {icon}
        </div>
        {trend && (
          <span className={`stat-trend ${trend > 0 ? 'up' : 'down'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );
};

export default StatCard;
