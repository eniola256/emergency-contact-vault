export const ROUTES = [
  'home',
  'register',
  'login',
  'forgot',
  'dashboard',
  'retrieve',
  'paid',
  'privacy',
];
export const readRoute = () => {
  const h = (window.location.hash || '').replace('#', '');
  return ROUTES.includes(h) ? h : 'home';
};
export const go = (r) => {
  window.location.hash = r === 'home' ? '' : r;
  if (r === 'home') window.dispatchEvent(new Event('hashchange'));
  window.scrollTo(0, 0);
};
