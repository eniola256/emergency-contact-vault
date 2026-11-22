import React from 'react';
import './Field.css';

export default function Field({ id, label, hint, ...p }) {
  return (
    <label className="f" htmlFor={id}>
      {label}
      {hint && <small>{hint}</small>}
      <input id={id} className="in" {...p} />
    </label>
  );
}
