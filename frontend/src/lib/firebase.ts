import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// FairLens Firebase Configuration (Google Solution Challenge 2026)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCHhVOKGGJLjd9o7dO8urj8Rb9pzBGcPMI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "fairlens-sc2026-af580.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fairlens-sc2026-af580",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "fairlens-sc2026-af580.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "369375708326",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:369375708326:web:a3eb35fdc44bd1478a2067",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  try {
    // connectAuthEmulator(auth, "http://localhost:9099");
    // connectFirestoreEmulator(db, "localhost", 8080);
    // connectStorageEmulator(storage, "localhost", 9199);
  } catch (e) {
    // Emulators already connected
  }
}

export { app, auth, db, storage };

// ============================================
// Auth Service
// ============================================

export const signInAnonymously = async () => {
  const { signInAnonymously } = await import("firebase/auth");
  return signInAnonymously(auth);
};

export const signInWithGoogle = async () => {
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signInWithEmail = async (email: string, password: string) => {
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { createUserWithEmailAndPassword } = await import("firebase/auth");
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOut = async () => {
  const { signOut: firebaseSignOut } = await import("firebase/auth");
  return firebaseSignOut(auth);
};

export const onAuthStateChanged = (callback: (user: any) => void) => {
  return auth.onAuthStateChanged(callback);
};

// ============================================
// Firestore Service
// ============================================

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp
} from "firebase/firestore";

export const firestoreService = {
  // Users
  async createUser(userData: any) {
    const docRef = doc(db, "users", userData.uid);
    await updateDoc(docRef, { ...userData, updatedAt: serverTimestamp() });
    return docRef.id;
  },

  async getUser(uid: string) {
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  },

  // Projects
  async createProject(projectData: any) {
    const docRef = await addDoc(collection(db, "projects"), {
      ...projectData,
      createdAt: serverTimestamp(),
      status: "active"
    });
    return docRef.id;
  },

  async getProjects(userId: string) {
    const q = query(
      collection(db, "projects"),
      where("ownerId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // Uploads
  async saveUpload(uploadData: any) {
    const docRef = await addDoc(collection(db, "uploads"), {
      ...uploadData,
      uploadedAt: serverTimestamp(),
      status: "pending"
    });
    return docRef.id;
  },

  async getUploads(projectId: string) {
    const q = query(
      collection(db, "uploads"),
      where("projectId", "==", projectId),
      orderBy("uploadedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // Audit Results
  async saveAuditResult(auditData: any) {
    const docRef = await addDoc(collection(db, "audit_results"), {
      ...auditData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getAuditResults(projectId: string) {
    const q = query(
      collection(db, "audit_results"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // Reports
  async saveReport(reportData: any) {
    const docRef = await addDoc(collection(db, "reports"), {
      ...reportData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }
};

// ============================================
// Storage Service
// ============================================

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export const storageService = {
  async uploadFile(path: string, file: File | Blob) {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },

  async getFileUrl(path: string) {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  },

  async deleteFile(path: string) {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }
};

// ============================================
// API Functions (for Cloud Functions or local development)
// ============================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export const apiService = {
  async uploadDataset(file: File, projectId: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    const response = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData
    });
    return response.json();
  },

  async runAudit(uploadId: string, options?: any) {
    const response = await fetch(`${API_BASE}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, ...options })
    });
    return response.json();
  },

  async generateInsights(auditId: string, metrics: any) {
    const response = await fetch(`${API_BASE}/insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auditId, metrics })
    });
    return response.json();
  },

  async whatIfChat(question: string, context?: any) {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context })
    });
    return response.json();
  },

  async generateReport(auditId: string, format: string = "markdown") {
    const response = await fetch(`${API_BASE}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auditId, format })
    });
    return response.json();
  }
};