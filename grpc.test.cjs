const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const phraseRequire = createRequire(path.join(__dirname, 'package.json'));
const { initializeApp, deleteApp } = phraseRequire('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, deleteDoc, terminate } = phraseRequire('firebase/firestore');

test('Phrase Firebase 12 client with patched gRPC interoperates with owner rules', async () => {
  const apps = [];
  const dbs = [];
  try {
    for (const uid of ['alice', 'bob']) {
      const app = initializeApp({projectId:'demo-security-audit',apiKey:'fixture-only',appId:'fixture-only'}, `phrase-${uid}`);
      const db = getFirestore(app);
      connectFirestoreEmulator(db, '127.0.0.1', 8787, {mockUserToken:{sub:uid}});
      apps.push(app); dbs.push(db);
    }
    const key = `tasks/grpc-compat-${Date.now()}`;
    await setDoc(doc(dbs[0],key), {userId:'alice',title:'fixture'});
    assert.equal((await getDoc(doc(dbs[0],key))).data().title,'fixture');
    await assert.rejects(getDoc(doc(dbs[1],key)), error=>error.code==='permission-denied');
    await deleteDoc(doc(dbs[0],key));
  } finally {
    await Promise.all(dbs.map(db=>terminate(db)));
    await Promise.all(apps.map(app=>deleteApp(app)));
  }
});