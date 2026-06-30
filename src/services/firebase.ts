import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Descomentar quando a chave reCAPTCHA Enterprise estiver configurada no GCP
// import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// TODO: Ativar antes do lançamento em produção
// 1. Criar chave reCAPTCHA Enterprise em https://console.cloud.google.com/security/recaptcha
// 2. Adicionar VITE_RECAPTCHA_SITE_KEY ao .env
// 3. Descomentar o import e as linhas abaixo:
//
// if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
//   initializeAppCheck(app, {
//     provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
//     isTokenAutoRefreshEnabled: true,
//   });
// }