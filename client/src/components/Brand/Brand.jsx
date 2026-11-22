import React from 'react';
import { go } from '../../lib/routes.js';
import './Brand.css';

export default function Brand() {
  return (
    <a
      className="brand"
      href="#"
      onClick={(e) => {
        e.preventDefault();
        go('home');
      }}
      aria-label="AE Vault home"
    >
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
          <path d="M8.8 12.2l2.2 2.2 4.2-4.4" />
        </svg>
      </span>
      AE Vault
    </a>
  );
}
