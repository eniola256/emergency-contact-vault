import { app } from './app.js';
import { config } from './config.js';
import { startBot } from './telegram/index.js';
app.listen(config.port, () => {
  console.log(`Vault API on :${config.port}`);
  startBot().catch((e) => console.error('Telegram bot failed to start:', e.message));
});
