# FairLens Firebase Configuration

## Installation

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Install frontend dependencies
cd frontend
npm install firebase
```

## Setup

1. **Create Firebase Project**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Create new project "fairlens"
   - Enable: Authentication, Firestore, Storage, Hosting

2. **Get Configuration**
   - Project Settings > General > Your apps > Web app
   - Copy firebaseConfig

3. **Set Environment Variables**
   Create `frontend/.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Configure Firestore Rules**
   ```bash
   firebase init firestore
   ```
   
   Edit `firestore.rules`:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

5. **Configure Storage Rules**
   ```bash
   firebase init storage
   ```
   
   Edit `storage.rules`:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

6. **Deploy**
   ```bash
   # Deploy all
   firebase deploy
   
   # Or just hosting
   firebase deploy --only hosting
   ```

## API Endpoints (After Deployment)

| Endpoint | URL | Description |
|----------|-----|-------------|
| Upload | https://PROJECT.web.app/api/upload | Upload dataset |
| Audit | https://PROJECT.web.app/api/audit | Run fairness |
| Insights | https://PROJECT.web.app/api/insights | AI insights |
| Chat | https://PROJECT.web.app/api/chat | What-if chat |
| Report | https://PROJECT.web.app/api/report | Generate report |

## Testing Locally

```bash
# Start Firebase emulator
firebase emulators:start

# Or start Next.js locally
cd frontend
npm run dev
```