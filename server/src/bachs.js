import { Bachs } from '@bachs/sdk';
import { config } from './config.js';
// Server-side only. The key prefix (sk_sandbox_ / sk_live_) selects the environment.
export const bachs = new Bachs({ apiKey: config.bachsKey });
