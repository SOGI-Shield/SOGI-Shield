import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function check() {
  let app;
  if (!getApps().length) {
    if (process.env.FIREBASE_PRIVATE_KEY) {
      app = initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  }

  const db = getFirestore(app);
  try {
    const secretsSnapshot = await db.collection('report_secrets').get();
    let migrated = 0;
    
    for (const doc of secretsSnapshot.docs) {
      const data = doc.data();
      if (data.trackingCode && !data.reportId) { // Old schema has trackingCode, new schema has reportId
        console.log(`Inverting legacy secret for report ${doc.id} with tracking code ${data.trackingCode}`);
        
        // Create new document with trackingCode as ID, and reportId as data
        await db.collection('report_secrets').doc(data.trackingCode).set({
          reportId: doc.id
        });
        
        // Delete old document
        await db.collection('report_secrets').doc(doc.id).delete();
        
        migrated++;
      }
    }
    console.log(`Successfully migrated ${migrated} secrets to the inverted schema.`);
  } catch(e) {
    console.error('Error:', e);
  }
}

check();
