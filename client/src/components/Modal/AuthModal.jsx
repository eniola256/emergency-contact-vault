import React, { useEffect } from 'react';
import './Modal.css';

// Sign in, sign up, reset and retrieve open in this dialog over the landing page.
export default function AuthModal({ label, onClose, children }) {
  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, []);
  return (
    <div
      className="scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal auth-modal" role="dialog" aria-modal="true" aria-label={label}>
        <button className="modal-x" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
