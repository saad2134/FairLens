# FairLens Cloud Functions
# Firebase Cloud Functions for FairLens AI Fairness Platform

from firebase_functions import https_fn, options
from firebase_admin import initialize_app, credentials, firestore
from google.generativeai import configure as configure_genai
import os
import json
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin
initialize_app()
db = firestore.client()

# Initialize Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
if GEMINI_API_KEY and 'YOUR_' not in GEMINI_API_KEY:
    configure_genai(api_key=GEMINI_API_KEY)
    gemini_model = None
    logger.info("Gemini API configured")
else:
    gemini_model = None
    logger.info("Using fallback mode (no Gemini key)")

# ============================================
# Fairness Engine Helpers
# ============================================

PROTECTED_PATTERNS = ['gender', 'sex', 'race', 'ethnicity', 'religion', 'age', 'caste', 'region', 'disability']

def detect_sensitive_cols(columns: list) -> list:
    """Detect protected attributes."""
    return [c for c in columns if any(p in c.lower() for p in PROTECTED_PATTERNS)]

def compute_fairness_metrics(data: list, sensitive_cols: list) -> Dict:
    """Compute fairness metrics."""
    import numpy as np
    
    if not data or not sensitive_cols:
        return {}
    
    results = {}
    
    for attr in sensitive_cols:
        try:
            # Group by attribute value
            values = [str(d.get(attr, '')) for d in data if d.get(attr)]
            unique_vals = list(set(values))[:10]
            
            group_scores = {}
            for val in unique_vals:
                scores = [d.get('score', 0.5) for d in data if str(d.get(attr, '')) == val]
                if scores:
                    group_scores[val] = float(np.mean(scores))
            
            if len(group_scores) >= 2:
                rates = list(group_scores.values())
                max_r, min_r = max(rates), min(rates)
                di = min_r / max_r if max_r > 0 else 0
                
                results[attr] = {
                    'demographic_parity': round(max_r - min_r, 4),
                    'disparate_impact': round(di, 4),
                    'group_scores': group_scores,
                    'severity': 'red' if di < 0.8 else 'amber' if di < 0.9 else 'green'
                }
        except Exception as e:
            logger.warning(f"Error computing {attr}: {e}")
    
    return results

def generate_insights(metrics: Dict, summary: Dict) -> str:
    """Generate insights (Gemini or fallback)."""
    score = summary.get('overall_score', 0)
    critical = sum(1 for m in metrics.values() if m.get('severity') == 'red')
    warnings = sum(1 for m in metrics.values() if m.get('severity') == 'amber')
    
    if gemini_model:
        try:
            prompt = f"Analyze: {json.dumps({'metrics': metrics, 'summary': summary})}"
            prompt += "\nProvide summary and recommendations."
            from google.generativeai import GenerativeModel
            model = GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.warning(f"Gemini error: {e}")
    
    # Fallback
    lines = ["## Fairness Audit Summary", "", f"**Score:** {score:.0%}" if score else "**Score:** N/A"]
    
    for attr, m in metrics.items():
        sev = m.get('severity', 'unknown')
        emoji = {'red': '🚨', 'amber': '⚠️', 'green': '✅'}.get(sev, '❓')
        lines.append(f"- {emoji} **{attr}:** DI={m.get('disparate_impact', 0):.2f}")
    
    if not gemini_model:
        lines.append("\n---\n*Add GEMINI_API_KEY for AI insights*")
    
    return "\n".join(lines)

# ============================================
# Cloud Functions Endpoints
# ============================================

@https_fn.on_request(max_instances=10)
def api(req: https_fn.Request) -> https_fn.Response:
    """Main API dispatcher."""
    path = req.path.strip('/')
    method = path.split('/')[-1] if '/' in path else path
    
    handlers = {
        'upload': handle_upload,
        'audit': handle_audit,
        'insights': handle_insights,
        'chat': handle_chat,
        'report': handle_report
    }
    
    handler = handlers.get(method)
    if handler:
        return handler(req)
    
    return https_fn.Response(json.dumps({'error': 'Not found', 'available': list(handlers.keys())}), status=404)

def handle_upload(req: https_fn.Request) -> https_fn.Response:
    """Upload dataset endpoint."""
    try:
        data = req.get_json(silent=True) or {}
        
        if 'data' in data:
            df_data = data['data']
            columns = list(df_data[0].keys()) if df_data else []
            sensitive_cols = detect_sensitive_cols(columns)
            
            upload_id = f"upload_{datetime.now().timestamp()}"
            db.collection('uploads').document(upload_id).set({
                'columns': columns,
                'sensitive_columns': sensitive_cols,
                'row_count': len(df_data),
                'uploaded_at': datetime.now().isoformat(),
                'status': 'uploaded'
            })
            
            return https_fn.Response(json.dumps({
                'upload_id': upload_id,
                'columns': columns,
                'sensitive_columns': sensitive_cols,
                'row_count': len(df_data),
                'status': 'success'
            }))
        
        return https_fn.Response(json.dumps({'error': 'No data provided'}), status=400)
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return https_fn.Response(json.dumps({'error': str(e)}), status=500)

def handle_audit(req: https_fn.Request) -> https_fn.Response:
    """Run fairness audit."""
    try:
        data = req.get_json(silent=True) or {}
        df_data = data.get('data', [])
        
        # Demo data if empty
        if not df_data:
            df_data = [
                {'name': 'John', 'gender': 'male', 'score': 0.75},
                {'name': 'Jane', 'gender': 'female', 'score': 0.82},
                {'name': 'Bob', 'gender': 'male', 'score': 0.68},
                {'name': 'Alice', 'gender': 'female', 'score': 0.88},
            ]
        
        columns = list(df_data[0].keys()) if df_data else []
        sensitive_cols = detect_sensitive_cols(columns)
        
        metrics = compute_fairness_metrics(df_data, sensitive_cols)
        
        critical = sum(1 for m in metrics.values() if m.get('severity') == 'red')
        warnings = sum(1 for m in metrics.values() if m.get('severity') == 'amber')
        score = max(0, 1 - (critical * 0.3 + warnings * 0.1))
        
        audit_id = f"audit_{datetime.now().timestamp()}"
        
        # Save to Firestore
        db.collection('audit_results').document(audit_id).set({
            'metrics': metrics,
            'summary': {'critical_violations': critical, 'warnings': warnings, 'overall_score': score},
            'created_at': datetime.now().isoformat()
        })
        
        return https_fn.Response(json.dumps({
            'audit_id': audit_id,
            'metrics': metrics,
            'summary': {'critical_violations': critical, 'warnings': warnings, 'overall_score': score},
            'status': 'success'
        }))
        
    except Exception as e:
        logger.error(f"Audit error: {e}")
        return https_fn.Response(json.dumps({'error': str(e)}), status=500)

def handle_insights(req: https_fn.Request) -> https_fn.Response:
    """Generate AI insights."""
    try:
        data = req.get_json(silent=True) or {}
        metrics = data.get('metrics', {})
        summary = data.get('summary', {'overall_score': 0.75})
        
        insights = generate_insights(metrics, summary)
        source = 'gemini' if gemini_model else 'fallback'
        
        return https_fn.Response(json.dumps({'insights': insights, 'source': source}))
        
    except Exception as e:
        logger.error(f"Insights error: {e}")
        return https_fn.Response(json.dumps({'error': str(e)}), status=500)

def handle_chat(req: https_fn.Request) -> https_fn.Response:
    """What-if chat."""
    try:
        data = req.get_json(silent=True) or {}
        question = data.get('question', '')
        
        if not question:
            return https_fn.Response(json.dumps({'error': 'No question'}), status=400)
        
        if gemini_model:
            try:
                from google.generativeai import GenerativeModel
                model = GenerativeModel('gemini-2.0-flash')
                response = model.generate_content(f"Fairness expert: {question}")
                return https_fn.Response(json.dumps({'answer': response.text, 'source': 'gemini'}))
            except: pass
        
        # Fallback
        q = question.lower()
        if 'remove' in q:
            answer = "Consider proxy discrimination through correlated features."
        elif 'improve' in q:
            answer = "Try: 1) Rebalancing data, 2) Fairness constraints, 3) Post-processing."
        else:
            answer = "Run an audit first, then ask specific questions."
        
        return https_fn.Response(json.dumps({'answer': answer, 'source': 'fallback'}))
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return https_fn.Response(json.dumps({'error': str(e)}), status=500)

def handle_report(req: https_fn.Request) -> https_fn.Response:
    """Generate compliance report."""
    try:
        data = req.get_json(silent=True) or {}
        metrics = data.get('metrics', {})
        summary = data.get('summary', {})
        audit_id = data.get('audit_id', 'N/A')
        
        lines = [
            "# FairLens Compliance Report",
            f"**Audit:** {audit_id}",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d')}",
            "",
            f"**Score:** {summary.get('overall_score', 0):.0%}",
            f"**Issues:** {summary.get('critical_violations', 0)}",
            "",
            "## Findings"
        ]
        
        for attr, m in metrics.items():
            lines.extend([f"### {attr}", f"- DI: {m.get('disparate_impact', 0):.4f}", ""])
        
        lines.extend([
            "---",
            "*Generated by FairLens*"
        ])
        
        if not gemini_model:
            lines.append("\nAdd GEMINI_API_KEY for AI reports.")
        
        return https_fn.Response(json.dumps({'report': '\n'.join(lines), 'format': 'markdown'}))
        
    except Exception as e:
        logger.error(f"Report error: {e}")
        return https_fn.Response(json.dumps({'error': str(e)}), status=500)