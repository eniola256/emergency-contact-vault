import 'express-async-errors'; // lets errors in async routes reach the error handler instead of crashing the server
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { auth } from './routes/auth.js';
import { contacts } from './routes/contacts.js';
import { retrieve } from './routes/retrieve.js';
import { payments } from './routes/payments.js';
import { webhooks } from './routes/webhooks.js';
import { privacy } from './routes/privacy.js';
import { telegram } from './routes/telegram.js';

export const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

app.use('/api/webhooks', webhooks);       // raw body, must precede express.json()
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', auth);
app.use('/api/contacts', contacts);
app.use('/api/retrieve', retrieve);
app.use('/api/payments', payments);
app.use('/api/privacy', privacy);
app.use('/api/telegram', telegram);

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Something went wrong on our side.' }); });
