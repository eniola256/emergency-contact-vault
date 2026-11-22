import React, { useCallback, useEffect, useState } from 'react';
import { go, readRoute } from './lib/routes.js';
import NetworkBg from './components/NetworkBg/NetworkBg.jsx';
import AuthModal from './components/Modal/AuthModal.jsx';
import Header from './components/Header/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import DemoBar from './components/DemoBar/DemoBar.jsx';
import SmsBanner from './components/DemoBar/SmsBanner.jsx';
import Toast from './components/Toast/Toast.jsx';
import Home from './pages/Home/Home.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import Forgot from './pages/Auth/Forgot.jsx';
import Retrieve from './pages/Retrieve/Retrieve.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Paid from './pages/Paid/Paid.jsx';
import Privacy from './pages/Privacy/Privacy.jsx';

// These four open as a dialog over the landing page. [title, component]
const MODALS = {
  login: ['Sign in', Login],
  register: ['Create an account', Register],
  forgot: ['Reset your password', Forgot],
  retrieve: ['Retrieve my contacts', Retrieve],
};

// Everything else is a normal page.
const PAGES = { home: Home, dashboard: Dashboard, paid: Paid, privacy: Privacy };

export default function App({ api }) {
  const [route, setRoute] = useState(readRoute);
  const [user, setUser] = useState(null);
  const [sms, setSms] = useState(null); // demo only: the simulated Telegram code
  const [toast, setToast] = useState('');

  const say = useCallback((text) => {
    setToast(text);
    setTimeout(() => setToast(''), 3500);
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const onSms = (e) => setSms(e.detail);
    window.addEventListener('demo-sms', onSms);
    return () => window.removeEventListener('demo-sms', onSms);
  }, []);

  useEffect(() => {
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null));
  }, [api]);

  const logout = async () => {
    await api.logout().catch(() => {});
    setUser(null);
    say('Signed out. Nothing from your vault is left on this screen.');
    go('home');
  };

  const ctx = { api, user, setUser, say, go }; // props every page receives
  const modal = MODALS[route];
  const Page = modal ? Home : PAGES[route]; // a modal sits on top of the landing page
  const ModalBody = modal?.[1];
  const showFooter = user || (route !== 'home' && !modal);

  return (
    <>
      <NetworkBg />
      {api.demo && <DemoBar api={api} />}
      <Header user={user} go={go} onLogout={logout} />
      {sms && <SmsBanner sms={sms} onDismiss={() => setSms(null)} />}
      <main>
        <Page {...ctx} />
        {modal && (
          <AuthModal label={modal[0]} onClose={() => go('home')}>
            <ModalBody {...ctx} />
          </AuthModal>
        )}
      </main>
      {showFooter && <Footer go={go} />}
      {toast && <Toast text={toast} />}
    </>
  );
}
