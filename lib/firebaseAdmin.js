let adminDbInstance = null;

export async function getAdminDb() {
  if (adminDbInstance) return adminDbInstance;

  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    if (!getApps().length) {
      if (process.env.FIREBASE_PRIVATE_KEY) {
        initializeApp({
          credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        // Fallback to Application Default Credentials
        initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      }
    }

    adminDbInstance = getApps().length > 0 ? getFirestore() : null;
    return adminDbInstance;
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
    return null;
  }
}
