import { Bachs } from '@bachs/sdk';
import { config } from './config.js';
// Server-side only. Created only when PAYMENTS_ENABLED=true, so the app runs without Bachs keys.
export const bachs = config.paymentsEnabled ? new Bachs({ apiKey: config.bachsKey }) : null;
