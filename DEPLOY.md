# FairLens - Quick Deploy Guide

## One-Command Deploy (Frontend + Backend)

```bash
# 1. Install Firebase CLI (if not installed)
npm install -g firebase-tools

# 2. Navigate to project
cd FairLens

# 3. Login to Firebase
firebase login

# 4. Create Firebase project at https://console.firebase.google.com
#    - Add project
#    - Enable: Authentication, Firestore, Storage, Hosting

# 5. Initialize Firebase
firebase init

# Select:
# ✓ Hosting: Configure files for Firebase Hosting
# ✓ Functions: Set up Cloud Functions
# ✓ Firestore: Set up Firestore
# ✓ Storage: Set up Cloud Storage

# 6. Build frontend
cd frontend
npm install
npm run build
cd ..

# 7. Deploy all (uses free tier)
firebase deploy

# Done! Your app is live at https://your-project.web.app
```

## Alternative: Deploy Only Frontend (Static)

```bash
firebase deploy --only hosting
```

## Alternative: Deploy Only Functions

```bash
firebase deploy --only functions
```

## Set Environment Variables

```bash
# In Firebase Console > Project Settings > Environment Variables
GEMINI_API_KEY=your_gemini_api_key_from_aistudio
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

## Free Tier Limits (Ample for Demo)

| Service | Free Tier | Enough for |
|---------|----------|-----------|
| Hosting | 1 GB | Yes |
| Firestore | 20K reads/writes/day | Yes |
| Storage | 5 GB | Yes |
| Functions | 2M invocations/month | Yes |
| Gemini | 15 RPM, 1M tokens/min | Yes |

**Total Cost: $0**

## Demo Flow for Judges

1. Open live URL
2. Click "Start Free Audit"
3. Upload `firebase-functions/sample_data.csv`
4. View fairness metrics + heatmap
5. Ask AI about issues
6. Download compliance report

## Local Development

```bash
# Emulators (no Firebase setup needed)
firebase emulators:start

# Or frontend only
cd frontend
npm run dev
```