import React from 'react';
import Icon from '../../components/Icon/Icon.jsx';
import MoreInfo from './MoreInfo.jsx';
import './Home.css';

export default function Home({ go, user }) {
  return (
    <>
      <section className={`landing${user ? ' signed' : ''}`}>
        <div className="wrap landing-in">
          <div className="icons" aria-hidden="true">
            <span className="tile">
              <Icon>
                <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
              </Icon>
            </span>
            <i className="join" />
            <span className="tile hot">
              <Icon>
                <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
                <path d="M8.8 12.2l2.2 2.2 4.2-4.4" />
              </Icon>
            </span>
            <i className="join" />
            <span className="tile">
              <Icon>
                <circle cx="12" cy="8" r="3" />
                <path d="M6.5 20v-1.2A4.3 4.3 0 0 1 10.8 14.5h2.4a4.3 4.3 0 0 1 4.3 4.3V20" />
                <circle cx="5.2" cy="9.6" r="2" />
                <circle cx="18.8" cy="9.6" r="2" />
                <path d="M2.5 18.5v-.8a3 3 0 0 1 3-3M21.5 18.5v-.8a3 3 0 0 0-3-3" />
              </Icon>
            </span>
          </div>
          <h1>
            <span>Lose your phone,</span> <span>not your numbers.</span>
          </h1>
          <p className="lead">
            Save the numbers that matter. If your phone is lost, sign in from any device and get
            them back in seconds.
          </p>
          <div className="cta-row">
            <button className="btn accent big" onClick={() => go(user ? 'dashboard' : 'register')}>
              {user ? 'My contacts' : 'Create an account'}
            </button>
            <button className="btn outline big" onClick={() => go('retrieve')}>
              Retrieve my contacts
            </button>
          </div>
          <p className="fine">
            3 contact slots are free, permanently. Saved numbers are encrypted.
          </p>
          {!user && (
            <a
              className="tiny"
              href="#privacy"
              onClick={(e) => {
                e.preventDefault();
                go('privacy');
              }}
            >
              Privacy and data requests
            </a>
          )}
        </div>
      </section>
      {user && <MoreInfo go={go} />}
    </>
  );
}
