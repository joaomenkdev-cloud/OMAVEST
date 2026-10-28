import { FIREBASE_CONFIG } from "./config.js";

let firebaseAuth = null;
let currentUser = null;
let initialized = false;

const configured = Object.values(FIREBASE_CONFIG).every(Boolean);

export async function initAuth() {
  if (initialized) return currentUser;
  initialized = true;
  if (!configured) return null;
  try {
    const [{ initializeApp }, authModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js")
    ]);
    const app = initializeApp(FIREBASE_CONFIG);
    firebaseAuth = authModule.getAuth(app);
    currentUser = await new Promise(resolve => {
      const unsub = authModule.onAuthStateChanged(firebaseAuth, user => { unsub(); resolve(user); });
    });
    return currentUser;
  } catch (error) {
    console.warn("Firebase Web não foi inicializado:", error);
    return null;
  }
}

export async function getUser() {
  await initAuth();
  return currentUser;
}

export async function getIdToken() {
  const user = await getUser();
  return user ? user.getIdToken() : null;
}

export async function login(email, password) {
  if (!configured) throw new Error("Configure FIREBASE_CONFIG em js/config.js antes de usar o login real.");
  await initAuth();
  const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js");
  const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
  currentUser = result.user;
  return currentUser;
}

export async function register(name, email, password) {
  if (!configured) throw new Error("Configure FIREBASE_CONFIG em js/config.js antes de criar contas.");
  await initAuth();
  const { createUserWithEmailAndPassword, updateProfile } = await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js");
  const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  await updateProfile(result.user, { displayName: name });
  currentUser = result.user;
  return currentUser;
}

export async function logout() {
  if (!firebaseAuth) return;
  const { signOut } = await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js");
  await signOut(firebaseAuth);
  currentUser = null;
}

export function isFirebaseConfigured() { return configured; }
