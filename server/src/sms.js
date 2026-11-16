// Replace the body of sendSms with your SMS gateway (Termii, Twilio, Africa's Talking, ...).
export async function sendSms(to, text) {
  if ((process.env.SMS_PROVIDER || 'console') === 'console') {
    console.log(`[sms:console] to ${to}: ${text}`);
    return;
  }
  throw new Error('No SMS provider configured. Implement it in src/sms.js');
}
