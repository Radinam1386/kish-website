import React from "react";
import "./StatCard.css";

function StatCard({ title, value, hint, icon, color }) {
  return (
    <div className="stat-card-p">
      <div className={`stat-card__icon-p ${color}`}>
        {icon}
      </div>

      <div className="stat-card__content-p">
        <span className="stat-card__title-p">{title}</span>

        <h3 className="stat-card__value-p">{value}</h3>

        {hint && (
          <p className="stat-card__hint-p">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

export default StatCard;