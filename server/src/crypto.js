import crypto from 'node:crypto';
import { config } from './config.js';

export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', config.encKey, iv);
  const ct = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), ct].map((b) => b.toString('base64')).join('.');
}
export function decrypt(blob) {
  const [iv, tag, ct] = blob.split('.').map((s) => Buffer.from(s, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', config.encKey, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
}
export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const randomCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
export const randomRef = () => 'slt_' + crypto.randomBytes(12).toString('hex');
