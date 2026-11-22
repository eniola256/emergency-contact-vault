// Small display helpers shared by pages.
export const fmt = (p) => {
  const m = /^\+234(\d{3})(\d{3})(\d{4})$/.exec(p || '');
  return m ? `+234 ${m[1]} ${m[2]} ${m[3]}` : p;
};
export const money = (cur, n) => `${cur === 'USD' ? '$' : cur + ' '}${n}`;

export const initials = (n) =>
  (
    String(n)
      .replace(/\(.*?\)/g, '')
      .trim()
      .split(/\s+/)
      .map((w) => (w.match(/\p{L}/u) || [''])[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('') || '?'
  ).toUpperCase();
