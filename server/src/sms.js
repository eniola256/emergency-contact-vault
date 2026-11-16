// Sends text messages. SMS_PROVIDER=console prints the message in the server log (development).
// SMS_PROVIDER=termii sends through Termii (https://developer.termii.com/messaging-api).
export async function sendSms(to, text) {
  const provider = process.env.SMS_PROVIDER || 'console';

  if (provider === 'console') {
    console.log(`[sms:console] to ${to}: ${text}`);
    return;
  }

  if (provider === 'termii') {
    const { TERMII_API_KEY, TERMII_BASE_URL, TERMII_SENDER_ID } = process.env;
    if (!TERMII_API_KEY || !TERMII_BASE_URL || !TERMII_SENDER_ID) {
      throw new Error('Termii is not configured: set TERMII_API_KEY, TERMII_BASE_URL and TERMII_SENDER_ID');
    }
    const res = await fetch(`${TERMII_BASE_URL.replace(/\/$/, '')}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        to: to.replace(/^\+/, ''),              // Termii wants international format without "+"
        from: TERMII_SENDER_ID,                 // sender ID approved in your Termii dashboard
        sms: text,
        type: 'plain',
        channel: process.env.TERMII_CHANNEL || 'dnd', // OTPs must use "dnd"; "generic" can't reach DND numbers
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Termii error', res.status, body);
      throw new Error('SMS could not be sent');
    }
    return;
  }

  throw new Error(`Unknown SMS_PROVIDER "${provider}"`);
}
