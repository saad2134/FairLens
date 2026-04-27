import numpy as np
import pandas as pd
import pickle
import joblib
import hashlib
from typing import Dict, Any, Optional, Callable
import requests
from pathlib import Path

class ModelLoader:
    def __init__(self, model_path: Optional[str] = None, endpoint_url: Optional[str] = None, 
                 api_token: Optional[str] = None):
        self.model_path = model_path
        self.endpoint_url = endpoint_url
        self.api_token = api_token
        self.model = None
        self.model_type = None
        self._load_model()
    
    def _load_model(self):
        if self.endpoint_url:
            self.model_type = 'api'
            return
        
        if self.model_path and Path(self.model_path).exists():
            ext = Path(self.model_path).suffix.lower()
            if ext in ['.pkl', '.pickle']:
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                self.model_type = 'pickle'
            elif ext in ['.joblib']:
                self.model = joblib.load(self.model_path)
                self.model_type = 'joblib'
            elif ext in ['.onnx']:
                try:
                    import onnxruntime as ort
                    self.model = ort.InferenceSession(self.model_path)
                    self.model_type = 'onnx'
                except ImportError:
                    raise ValueError("ONNX Runtime not installed")
            else:
                raise ValueError(f"Unsupported model format: {ext}")
        elif self.model_path:
            raise FileNotFoundError(f"Model file not found: {self.model_path}")
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if self.endpoint_url:
            return self._predict_api(X)
        
        if self.model_type in ['pickle', 'joblib']:
            return self._predict_sklearn(X)
        elif self.model_type == 'onnx':
            return self._predict_onnx(X)
        
        raise ValueError("No model loaded")
    
    def _predict_sklearn(self, X: pd.DataFrame) -> np.ndarray:
        if hasattr(self.model, 'predict'):
            preds = self.model.predict(X)
            if len(preds.shape) == 1:
                return preds
            return preds[:, 1] if preds.shape[1] > 1 else preds.ravel()
        return np.array([])
    
    def _predict_onnx(self, X: pd.DataFrame) -> np.ndarray:
        import onnxruntime as ort
        input_name = self.model.get_inputs()[0].name
        output_name = self.model.get_outputs()[0].name
        
        features = X.values.astype(np.float32)
        result = self.model.run([output_name], {input_name: features})[0]
        
        if len(result.shape) == 1:
            return result
        return result[:, 1] if result.shape[1] > 1 else result.ravel()
    
    def _predict_api(self, X: pd.DataFrame) -> np.ndarray:
        headers = {}
        if self.api_token:
            headers['Authorization'] = f'Bearer {self.api_token}'
        
        try:
            response = requests.post(
                self.endpoint_url,
                json={'instances': X.to_dict(orient='records')},
                headers={**headers, 'Content-Type': 'application/json'},
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            if 'predictions' in result:
                return np.array(result['predictions'])
            elif 'values' in result:
                return np.array(result['values'])
            return np.array(result)
        except requests.RequestException as e:
            raise RuntimeError(f"API prediction failed: {str(e)}")
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        if self.endpoint_url:
            return self.predict(X)
        
        if hasattr(self.model, 'predict_proba'):
            probs = self.model.predict_proba(X)
            return probs[:, 1] if probs.shape[1] > 1 else probs.ravel()
        
        preds = self.predict(X)
        return preds

def compute_model_hash(model_path: str) -> str:
    hasher = hashlib.sha256()
    with open(model_path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            hasher.update(chunk)
    return hasher.hexdigest()

def load_model_for_audit(model_path: str, endpoint_url: Optional[str] = None, 
                          api_token: Optional[str] = None) -> Callable[[pd.DataFrame], np.ndarray]:
    loader = ModelLoader(model_path, endpoint_url, api_token)
    return loader.predict