// Mirrors server/src/security.js so the form can warn before the request is sent. The server is the real check.
const COMMON = new Set("password passw0rd password1 password12 password123 1234567890 12345678910 0123456789 0987654321 qwertyuiop qwerty12345 qwerty123456 1q2w3e4r5t 1qaz2wsx3edc asdfghjkl1 zxcvbnm123 iloveyou123 letmein1234 welcome1234 admin12345 administrator abcdefghij abcd123456 abc1234567 11111111111 00000000000 changeme123 monkey12345 dragon12345 football123 naijaboy123 lagos12345 nigeria1234 vault12345 emergency123 godisgood123 jesus12345".split(" "));
export const MIN_PASSWORD = 10;
export function passwordProblem(pw = '', phone = '') {
  if (pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (pw.length > 128) return 'Use 128 characters or fewer.';
  if (COMMON.has(pw.toLowerCase()) || /^(.)\1+$/.test(pw)) return 'That password is too easy to guess. Choose something less common.';
  const d = String(phone).replace(/\D/g, '');
  if (d.length >= 7 && pw.replace(/\D/g, '').includes(d.slice(-9))) return 'Do not use your phone number in your password.';
  return null;
}
