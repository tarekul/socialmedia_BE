const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const increment = admin.firestore.FieldValue.increment(1)

module.exports = {admin,db,increment}