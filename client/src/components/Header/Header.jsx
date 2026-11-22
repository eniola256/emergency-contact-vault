import React from 'react';
import Brand from '../Brand/Brand.jsx';
import './Header.css';

export default function Header({ user, go, onLogout }) {
  return (
    <header className="top">
      <div className="wrap">
        <Brand />
        <nav aria-label="Main">
          {user ? (
            <>
              <button className="btn ghost sm" onClick={() => go('dashboard')}>
                My contacts
              </button>
              <button className="btn ghost sm" onClick={() => go('retrieve')}>
                Retrieve
              </button>
              <button className="btn sm" onClick={onLogout}>
                Log out
              </button>
            </>
          ) : (
            <button className="btn ghost sm link" onClick={() => go('login')}>
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
