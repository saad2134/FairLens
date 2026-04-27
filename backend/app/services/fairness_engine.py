import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import hashlib
import json
from pathlib import Path

SENSITIVE_COLUMNS = {
    'gender', 'sex', 'male', 'female', 'race', 'ethnicity', 'nationality',
    'religion', 'age', 'dob', 'birth_date', 'caste', 'region', 'province',
    'disability', 'veteran', 'marital_status', 'pregnancy', 'sexual_orientation'
}

PROTECTED_ATTR_PATTERNS = [
    'gender', 'sex', 'race', 'ethnicity', 'religion', 'age', 'caste',
    'region', 'disability', 'veteran', 'nationality', 'sexual_orientation'
]

def detect_sensitive_columns(df: pd.DataFrame) -> List[str]:
    detected = []
    columns_lower = {col.lower(): col for col in df.columns}
    
    for pattern in PROTECTED_ATTR_PATTERNS:
        for lower_col, original_col in columns_lower.items():
            if pattern in lower_col:
                if original_col not in detected:
                    detected.append(original_col)
    
    return detected

def compute_file_hash(file_path: str) -> str:
    hasher = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            hasher.update(chunk)
    return hasher.hexdigest()

def compute_data_hash(df: pd.DataFrame) -> str:
    data_str = df.to_json()
    return hashlib.sha256(data_str.encode()).hexdigest()

def infer_column_types(df: pd.DataFrame) -> Dict[str, str]:
    type_map = {}
    for col in df.columns:
        if df[col].dtype == 'object':
            unique_ratio = df[col].nunique() / len(df)
            if unique_ratio < 0.05:
                type_map[col] = 'categorical'
            else:
                type_map[col] = 'text'
        elif df[col].dtype in ['int64', 'float64']:
            if df[col].nunique() <= 10:
                type_map[col] = 'categorical'
            else:
                type_map[col] = 'numeric'
        else:
            type_map[col] = 'unknown'
    return type_map

class FairnessEngine:
    def __init__(self, df: pd.DataFrame, predictions: np.ndarray, sensitive_cols: List[str]):
        self.df = df
        self.predictions = predictions
        self.sensitive_cols = sensitive_cols
        self.sensitive_cols = [c for c in sensitive_cols if c in df.columns]
    
    def _get_groups(self, attribute: str) -> Tuple[np.ndarray, np.ndarray]:
        col = self.df[attribute]
        if col.dtype == 'object' or col.nunique() <= 10:
            value_counts = col.value_counts()
            privileged = value_counts.index[0] if len(value_counts) > 0 else col.mode().iloc[0] if not col.mode().empty else col.iloc[0]
            privileged_mask = col == privileged
            unprivileged_mask = col != privileged
        else:
            median = col.median()
            privileged_mask = col >= median
            unprivileged_mask = col < median
        
        return privileged_mask.values, unprivileged_mask.values
    
    def demographic_parity_difference(self, attribute: str) -> Dict[str, float]:
        privileged_mask, unprivileged_mask = self._get_groups(attribute)
        
        privileged_rate = self.predictions[privileged_mask].mean() if privileged_mask.sum() > 0 else 0
        unprivileged_rate = self.predictions[unprivileged_mask].mean() if unprivileged_mask.sum() > 0 else 0
        
        diff = unprivileged_rate - privileged_rate
        severity = self._get_severity(abs(diff), [0.1, 0.2, 0.3])
        
        return {
            'value': diff,
            'severity': severity,
            'privileged_rate': privileged_rate,
            'unprivileged_rate': unprivileged_rate,
            'privileged_group': 'majority',
            'unprivileged_group': 'minority'
        }
    
    def equal_opportunity_difference(self, attribute: str, y_true: Optional[np.ndarray] = None) -> Dict[str, float]:
        if y_true is None:
            y_true = self.predictions
        
        privileged_mask, unprivileged_mask = self._get_groups(attribute)
        
        priv_positive = y_true[privileged_mask] == 1
        unpriv_positive = y_true[unprivileged_mask] == 1
        
        priv_tpr = priv_positive.mean() if priv_positive.sum() > 0 else 0
        unpriv_tpr = unpriv_positive.mean() if unpriv_positive.sum() > 0 else 0
        
        diff = unpriv_tpr - priv_tpr
        severity = self._get_severity(abs(diff), [0.1, 0.2, 0.3])
        
        return {
            'value': diff,
            'severity': severity,
            'privileged_tpr': priv_tpr,
            'unprivileged_tpr': unpriv_tpr,
            'privileged_group': 'majority',
            'unprivileged_group': 'minority'
        }
    
    def disparate_impact_ratio(self, attribute: str) -> Dict[str, float]:
        privileged_mask, unprivileged_mask = self._get_groups(attribute)
        
        privileged_rate = self.predictions[privileged_mask].mean() if privileged_mask.sum() > 0 else 1.0
        unprivileged_rate = self.predictions[unprivileged_mask].mean() if unprivileged_mask.sum() > 0 else 0
        
        ratio = unprivileged_rate / privileged_rate if privileged_rate > 0 else 0
        
        severity = 'green'
        if ratio < 0.8:
            severity = 'red'
        elif ratio < 0.9:
            severity = 'amber'
        
        return {
            'value': ratio,
            'severity': severity,
            'threshold': 0.8,
            'privileged_rate': privileged_rate,
            'unprivileged_rate': unprivileged_rate
        }
    
    def equalized_odds(self, attribute: str, y_true: Optional[np.ndarray] = None) -> Dict[str, float]:
        if y_true is None:
            y_true = self.predictions
        
        privileged_mask, unprivileged_mask = self._get_groups(attribute)
        
        priv_tpr = ((y_true == 1) & privileged_mask).sum() / privileged_mask.sum() if privileged_mask.sum() > 0 else 0
        unpriv_tpr = ((y_true == 1) & unprivileged_mask).sum() / unprivileged_mask.sum() if unprivileged_mask.sum() > 0 else 0
        
        priv_fpr = ((y_true == 0) & privileged_mask).sum() / privileged_mask.sum() if privileged_mask.sum() > 0 else 0
        unpriv_fpr = ((y_true == 0) & unprivileged_mask).sum() / unprivileged_mask.sum() if unprivileged_mask.sum() > 0 else 0
        
        tpr_diff = abs(unpriv_tpr - priv_tpr)
        fpr_diff = abs(unpriv_fpr - priv_fpr)
        combined_diff = (tpr_diff + fpr_diff) / 2
        severity = self._get_severity(combined_diff, [0.1, 0.2, 0.3])
        
        return {
            'value': combined_diff,
            'severity': severity,
            'tpr_difference': tpr_diff,
            'fpr_difference': fpr_diff,
            'privileged_tpr': priv_tpr,
            'unprivileged_tpr': unpriv_tpr,
            'privileged_fpr': priv_fpr,
            'unprivileged_fpr': unpriv_fpr
        }
    
    def _get_severity(self, value: float, thresholds: List[float]) -> str:
        if value < thresholds[0]:
            return 'green'
        elif value < thresholds[1]:
            return 'amber'
        return 'red'
    
    def compute_all_metrics(self, y_true: Optional[np.ndarray] = None) -> Dict[str, List[Dict]]:
        results = {}
        
        for attr in self.sensitive_cols:
            results[attr] = {
                'demographic_parity': self.demographic_parity_difference(attr),
                'equal_opportunity': self.equal_opportunity_difference(attr, y_true),
                'disparate_impact': self.disparate_impact_ratio(attr),
                'equalized_odds': self.equalized_odds(attr, y_true)
            }
        
        return results
    
    def generate_heatmap_data(self) -> List[Dict]:
        cells = []
        
        for attr in self.sensitive_cols:
            di = self.disparate_impact_ratio(attr)
            
            severity = 'green'
            if di['value'] < 0.8:
                severity = 'red'
            elif di['value'] < 0.9:
                severity = 'amber'
            
            cells.append({
                'feature': 'prediction',
                'protected_attribute': attr,
                'disparate_impact': di['value'],
                'severity': severity,
                'metric_value': di['value']
            })
        
        return cells

def run_fairness_audit(df: pd.DataFrame, predictions: np.ndarray, sensitive_cols: List[str], 
                       y_true: Optional[np.ndarray] = None) -> Dict[str, Any]:
    engine = FairnessEngine(df, predictions, sensitive_cols)
    
    metrics = engine.compute_all_metrics(y_true)
    heatmap_data = engine.generate_heatmap_data()
    
    severity_counts = {'green': 0, 'amber': 0, 'red': 0}
    total_di = 0
    
    for attr_data in metrics.values():
        for metric_data in attr_data.values():
            sev = metric_data.get('severity', 'green')
            if sev in severity_counts:
                severity_counts[sev] += 1
            if 'value' in metric_data and 'disparate_impact' in str(metric_data):
                total_di += abs(metric_data['value'] - 1.0)
    
    avg_fairness = max(0, 1 - (severity_counts['red'] * 0.3 + severity_counts['amber'] * 0.1) / 
                       max(1, severity_counts['red'] + severity_counts['amber'] + severity_counts['green']))
    
    return {
        'metrics': metrics,
        'heatmap': heatmap_data,
        'summary': {
            'critical_violations': severity_counts['red'],
            'warning_count': severity_counts['amber'],
            'passing_count': severity_counts['green'],
            'overall_fairness_score': avg_fairness
        }
    }