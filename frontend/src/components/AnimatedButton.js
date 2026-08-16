import { useState } from 'react';
import './Button.css';

export function AnimatedButton({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  onClick,
  disabled = false,
  loading = false,
  icon 
}) {
  const [ripples, setRipples] = useState([]);

  const createRipple = (e) => {
    if (disabled || loading) return;
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now() + Math.random()
    };

    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  const handleClick = (e) => {
    createRipple(e);
    if (onClick && !disabled && !loading) {
      onClick(e);
    }
  };

  return (
    <button
      className={`animated-btn animated-btn--${variant} animated-btn--${size} ${disabled ? 'animated-btn--disabled' : ''} ${loading ? 'animated-btn--loading' : ''}`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      <span className="animated-btn__content">
        {loading && (
          <span className="animated-btn__spinner" />
        )}
        {icon && !loading && (
          <span className="animated-btn__icon">{icon}</span>
        )}
        {children}
      </span>
      
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="animated-btn__ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size
          }}
        />
      ))}
    </button>
  );
}
