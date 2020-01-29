const admin = require("firebase-admin");
const serviceAccount = require("../socialapp-caeff-firebase-adminsdk-y9tvi-d8db4031eb.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialapp-caeff.firebaseio.com",
  storageBucket: "socialapp-caeff.appspot.com"
});

const db = admin.firestore();
const increment = admin.firestore.FieldValue.increment(1);

module.exports = { admin, db, increment };
