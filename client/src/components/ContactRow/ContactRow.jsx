import React from 'react';
import { fmt, initials } from '../../lib/format.js';
import './ContactRow.css';

// One saved contact: avatar, name, number, and whatever actions the page passes as children.
export default function ContactRow({ name, phone, role, children }) {
  return (
    <div className="row" role={role}>
      <div className="person">
        <span className="avatar" aria-hidden="true">
          {initials(name)}
        </span>
        <div className="who">
          <b>{name}</b>
          <span className="tel">{fmt(phone)}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
