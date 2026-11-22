// Real API client. In demo builds (VITE_DEMO=1) main.jsx swaps in mockApi.js instead.
async function req(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.error || 'Something went wrong. Try again.');
    e.status = res.status;
    e.code = data.code;
    throw e;
  }
  return data;
}
export const api = {
  demo: false,
  register: (phone, password) => req('POST', '/auth/register', { phone, password }),
  verifyRegistration: (phone, code) => req('POST', '/auth/register/verify', { phone, code }),
  login: (phone, password) => req('POST', '/auth/login', { phone, password }),
  logout: () => req('POST', '/auth/logout'),
  me: () => req('GET', '/auth/me'),
  forgot: (phone) => req('POST', '/auth/forgot', { phone }),
  reset: (phone, code, password) => req('POST', '/auth/reset', { phone, code, password }),
  deleteAccount: (password) => req('POST', '/auth/delete-account', { password }),
  listContacts: () => req('GET', '/contacts'),
  addContact: (name, phone) => req('POST', '/contacts', { name, phone }),
  updateContact: (id, name, phone) => req('PUT', `/contacts/${id}`, { name, phone }),
  removeContact: (id) => req('DELETE', `/contacts/${id}`),
  retrieve: (phone, password) => req('POST', '/retrieve', { phone, password }),
  packages: () => req('GET', '/payments/packages'),
  checkout: (packageId) => req('POST', '/payments/checkout', { packageId }),
  latestPurchase: () => req('GET', '/payments/latest'),
  report: (kind, phone, message) => req('POST', '/privacy/report', { kind, phone, message }),
};
