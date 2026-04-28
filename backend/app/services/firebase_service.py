import os
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class FirebaseService:
    def __init__(self):
        self.project_id = os.getenv("FIREBASE_PROJECT_ID", "")
        self.database_url = os.getenv("FIREBASE_DATABASE_URL", "")
        self.private_key = os.getenv("FIREBASE_PRIVATE_KEY", "")
        self.client_email = os.getenv("FIREBASE_CLIENT_EMAIL", "")
        
        self.is_configured = bool(
            self.project_id and 
            self.project_id != "YOUR_PROJECT_ID" and
            self.database_url
        )
        
        self.client = None
        self.db = None
        
        if self.is_configured:
            try:
                import firebase_admin
                from firebase_admin import credentials, firestore
                
                # Try to initialize with env vars or JSON file
                if self.private_key and self.client_email:
                    import json
                    from google.oauth2 import service_account
                    
                    # Create credentials from env vars
                    cred_dict = {
                        "type": "service_account",
                        "project_id": self.project_id,
                        "private_key": self.private_key.replace("\\n", "\n"),
                        "client_email": self.client_email
                    }
                    creds = credentials.Certificate(cred_dict)
                else:
                    # Try to load from JSON file
                    cred_path = os.path.join(os.path.dirname(__file__), "..", "firebase-adminsdk.json")
                    if os.path.exists(cred_path):
                        creds = credentials.Certificate(cred_path)
                    else:
                        raise ValueError("No Firebase credentials found")
                
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(creds)
                
                self.db = firestore.client()
                self.client = firebase_admin
                logger.info("[FirebaseService] Connected to Firebase")
            except ImportError as e:
                logger.warning(f"[FirebaseService] firebase-admin not installed: {e}")
                self.is_configured = False
            except Exception as e:
                logger.warning(f"[FirebaseService] Failed to initialize: {e}")
                self.is_configured = False
        else:
            logger.info("[FirebaseService] No Firebase config, using fallback mode")
    
    def verify_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        """Verify Firebase ID token and return user info."""
        if not self.is_configured:
            return self._fallback_verify(id_token)
        
        try:
            from firebase_admin import auth
            decoded = auth.verify_id_token(id_token)
            logger.info(f"[FirebaseService] Verified user: {decoded.get('uid')}")
            return decoded
        except Exception as e:
            logger.warning(f"[FirebaseService] Token verification failed: {e}")
            return self._fallback_verify(id_token)
    
    def _fallback_verify(self, id_token: str) -> Optional[Dict[str, Any]]:
        """Fallback token verification (for development)."""
        # For development: accept any token with "test_" prefix
        if id_token.startswith("test_"):
            return {
                "uid": id_token.replace("test_", ""),
                "email": f"{id_token}@example.com",
                "email_verified": True
            }
        # For demo: accept token "demo"
        elif id_token == "demo":
            return {
                "uid": "demo_user",
                "email": "demo@fairlens.ai",
                "email_verified": True
            }
        # Reject otherwise
        return None
    
    def get_user(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get user data from Firebase."""
        if not self.is_configured:
            return {"uid": uid, "email": f"{uid}@example.com", "fallback": True}
        
        try:
            from firebase_admin import auth
            user = auth.get_user(uid)
            return {
                "uid": user.uid,
                "email": user.email,
                "display_name": user.display_name,
                "disabled": user.disabled
            }
        except Exception as e:
            logger.warning(f"[FirebaseService] Get user failed: {e}")
            return None
    
    def create_custom_token(self, uid: str, claims: Dict = None) -> str:
        """Create custom token for testing."""
        if not self.is_configured:
            return f"test_{uid}"
        
        try:
            from firebase_admin import auth
            return auth.create_custom_token(uid, claims)
        except Exception as e:
            logger.warning(f"[FirebaseService] Create token failed: {e}")
            return f"test_{uid}"
    
    def save_audit_to_firebase(self, user_id: str, audit_data: Dict) -> bool:
        """Save audit results to Firebase Firestore."""
        if not self.is_configured or not self.db:
            logger.info("[FirebaseService] Using local storage fallback")
            return self._save_audit_local(user_id, audit_data)
        
        try:
            doc_ref = self.db.collection("audits").document(audit_data.get("id", "unknown"))
            doc_ref.set({
                **audit_data,
                "user_id": user_id,
                "created_at": firestore.SERVER_TIMESTAMP
            })
            logger.info(f"[FirebaseService] Saved audit to Firebase")
            return True
        except Exception as e:
            logger.warning(f"[FirebaseService] Save failed: {e}")
            return self._save_audit_local(user_id, audit_data)
    
    def _save_audit_local(self, user_id: str, audit_data: Dict) -> bool:
        """Fallback local save (always works)."""
        import json
        from pathlib import Path
        
        local_dir = Path(os.path.dirname(__file__)).parent / "local_data"
        local_dir.mkdir(exist_ok=True)
        
        filename = local_dir / f"audit_{user_id}_{audit_data.get('id', 'unknown')}.json"
        with open(filename, "w") as f:
            json.dump(audit_data, f, indent=2, default=str)
        
        logger.info(f"[FirebaseService] Saved audit locally: {filename}")
        return True
    
    def get_user_audits(self, user_id: str) -> list:
        """Get user's audit history."""
        if not self.is_configured or not self.db:
            return self._get_audits_local(user_id)
        
        try:
            docs = self.db.collection("audits").where("user_id", "==", user_id).stream()
            return [{"id": doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            logger.warning(f"[FirebaseService] Get audits failed: {e}")
            return self._get_audits_local(user_id)
    
    def _get_audits_local(self, user_id: str) -> list:
        """Fallback local audit retrieval."""
        import json
        from pathlib import Path
        
        local_dir = Path(os.path.dirname(__file__)).parent / "local_data"
        if not local_dir.exists():
            return []
        
        audits = []
        for f in local_dir.glob(f"audit_{user_id}_*.json"):
            try:
                with open(f) as fp:
                    audits.append(json.load(fp))
            except:
                pass
        return audits


_firebase_service: Optional[FirebaseService] = None

def get_firebase_service() -> FirebaseService:
    global _firebase_service
    if _firebase_service is None:
        _firebase_service = FirebaseService()
    return _firebase_service