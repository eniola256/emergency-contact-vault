import React from 'react';
import './Footer.css';

export default function Footer({ go }) {
  return (
    <footer>
      <div className="wrap">
        <span>
          Demonstration project, not a guaranteed emergency service. It needs an internet connection
          and the service to be running.
        </span>
        <span>
          <a
            href="#privacy"
            onClick={(e) => {
              e.preventDefault();
              go('privacy');
            }}
          >
            Privacy and data requests
          </a>
        </span>
      </div>
    </footer>
  );
}
