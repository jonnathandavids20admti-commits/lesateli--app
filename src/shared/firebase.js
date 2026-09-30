const admin = require('firebase-admin');
function getAdmin() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('Variável FIREBASE_SERVICE_ACCOUNT não configurada.');
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
  }
  return admin;
}
module.exports = { getAdmin };
