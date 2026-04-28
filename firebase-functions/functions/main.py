"""
FairLens Cloud Functions
Firebase Cloud Functions for FairLens AI Fairness Auditing Platform
"""

import functions_framework
import os
import json
import logging
from typing import Dict, List, Any
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize globals
db = None
gemini_model = None

def init_services():
    """Initialize Firebase and Gemini."""
    global db, gemini_model
    
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        if not firebase_admin._apps:
            try:
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred, {
                    'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'fairlens.web.app')
                })
            except: pass
        db = firestore.client()
    except Exception as e:
        logger.warning(f"Firestore init: {e}")
    
    try:
        import google.generativeai as genai
        api_key = os.getenv('GEMINI_API_KEY', '')
        if api_key and 'YOUR_' not in api_key:
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel('gemini-2.0-flash')
            logger.info("Gemini ready")
    except Exception as e:
        logger.warning(f"Gemini init: {e}")

init_services()

# ============================================
# Fairness Engine Helpers
# ============================================

PROTECTED_PATTERNS = ['gender', 'sex', 'race', 'ethnicity', 'religion', 'age', 'caste', 'region', 'disability']

def detect_sensitive_cols(columns: List[str]) -> List[str]:
    """Detect protected attributes."""
    return [c for c in columns if any(p in c.lower() for p in PROTECTED_PATTERNS)]

def compute_fairness_metrics(df_data: List[Dict], sensitive_cols: List[str]) -> Dict:
    """Compute fairness metrics from data."""
    if not df_data or not sensitive_cols:
        return {}
    
    import numpy as np
    
    # Extract predictions (use score field or default to random)
    predictions = np.array([d.get('score', np.random.rand()) for d in df_data])
    
    results = {}
    for attr in sensitive_cols:
        try:
            values = [str(d.get(attr, '')) for d in df_data if d.get(attr)]
            unique_vals = list(set(values))[:10]
            
            group_scores = {}
            for val in unique_vals:
                mask = np.array([v == val for v in values])
                if mask.sum() > 0:
                    group_scores[val] = float(predictions[mask].mean())
            
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

def generate_fallback_insights(metrics: Dict, summary: Dict) -> str:
    """Generate fallback insights."""
    score = summary.get('overall_score', 0)
    critical = summary.get('critical_violations', 0)
    warnings = summary.get('warnings', 0)
    
    lines = [
        "## Fairness Audit Summary",
        "",
        f"**Overall Fairness Score:** {score:.0%}" if score else "**Fairness Score:** Calculating...",
        "",
        f"{'🚨 CRITICAL: ' + str(critical) + ' violations' if critical > 0 else '✅ All checks passed'}"
    ]
    
    for attr, data in metrics.items():
        sev = data.get('severity', 'unknown')
        di = data.get('disparate_impact', 0)
        emoji = {'red': '🚨', 'amber': '⚠️', 'green': '✅'}.get(sev, '❓')
        lines.append(f"- {emoji} **{attr.title()}:** DI = {di:.2f}")
    
    lines.append("")
    if critical > 0:
        lines.append("### Recommendations\n1. Review critical violations\n2. Check training data balance")
    else:
        lines.append("### Recommendations\n1. Continue monitoring\n2. Track metrics over time")
    
    if not gemini_model:
        lines.append("\n---\n*Add GEMINI_API_KEY for AI insights*")
    
    return "\n".join(lines)

# ============================================
# HTTP Cloud Functions
# ============================================

@functions_framework.http
def upload_dataset(request):
    """Upload and process dataset."""
    from flask import jsonify
    
    try:
        # Handle JSON request
        data = request.get_json(silent=True) or {}
        
        if 'data' in data:
            # JSON data (simpler for demo)
            df_data = data['data']
            columns = list(df_data[0].keys()) if df_data else []
            sensitive_cols = detect_sensitive_cols(columns)
            
            upload_id = f"upload_{datetime.now().timestamp()}"
            
            if db:
                db.collection('uploads').document(upload_id).set({
                    'filename': data.get('filename', 'data.csv'),
                    'columns': columns,
                    'sensitive_columns': sensitive_cols,
                    'row_count': len(df_data),
                    'uploaded_at': datetime.now().isoformat(),
                    'status': 'uploaded'
                })
            
            return jsonify({
                'upload_id': upload_id,
                'columns': columns,
                'sensitive_columns': sensitive_cols,
                'row_count': len(df_data),
                'status': 'success'
            })
        
        # File upload (multipart)
        if request.files:
            file = request.files.get('file')
            content = file.read().decode('utf-8') if file else ''
            lines = content.strip().split('\n')
            if lines:
                headers = lines[0].split(',')
                data_rows = []
                for line in lines[1:min(101, len(lines))]:
                    if line.strip():
                        vals = line.split(',')
                        data_rows.append(dict(zip(headers, vals)))
                
                sensitive_cols = detect_sensitive_cols(headers)
                upload_id = f"upload_{datetime.now().timestamp()}"
                
                if db:
                    db.collection('uploads').document(upload_id).set({
                        'filename': file.filename,
                        'columns': headers,
                        'sensitive_columns': sensitive_cols,
                        'row_count': len(lines) - 1,
                        'uploaded_at': datetime.now().isoformat(),
                        'status': 'uploaded'
                    })
                
                return jsonify({
                    'upload_id': upload_id,
                    'columns': headers,
                    'sensitive_columns': sensitive_cols,
                    'row_count': len(lines) - 1,
                    'sample': data_rows[:3],
                    'status': 'success'
                })
        
        return jsonify({'error': 'No data provided', 'hint': 'Send JSON with array of objects or multipart file'}), 400
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'error': str(e)}), 500

@functions_framework.http
def run_audit(request):
    """Run fairness audit."""
    from flask import jsonify
    
    try:
        data = request.get_json(silent=True) or {}
        upload_id = data.get('upload_id', 'demo')
        
        # Get data from Firestore or use demo
        df_data = data.get('data', [])
        
        if not df_data and db:
            doc = db.collection('uploads').document(upload_id).get()
            if doc.exists:
                df_data = doc.to_dict().get('data', [])
        
        # Demo data if empty
        if not df_data:
            df_data = [
                {'name': 'John', 'age': 25, 'gender': 'male', 'race': 'white', 'score': 75},
                {'name': 'Jane', 'age': 30, 'gender': 'female', 'race': 'black', 'score': 82},
                {'name': 'Bob', 'age': 35, 'gender': 'male', 'race': 'hispanic', 'score': 68},
                {'name': 'Alice', 'age': 28, 'gender': 'female', 'race': 'asian', 'score': 88},
                {'name': 'Charlie', 'age': 42, 'gender': 'male', 'race': 'white', 'score': 91},
                {'name': 'Diana', 'age': 38, 'gender': 'female', 'race': 'black', 'score': 79},
            ]
        
        columns = list(df_data[0].keys()) if df_data else []
        sensitive_cols = detect_sensitive_cols(columns)
        
        metrics = compute_fairness_metrics(df_data, sensitive_cols)
        
        critical = sum(1 for m in metrics.values() if m.get('severity') == 'red')
        warnings = sum(1 for m in metrics.values() if m.get('severity') == 'amber')
        
        heatmap = [
            {'feature': 'score', 'protected_attribute': k, 'disparate_impact': v.get('disparate_impact', 0), 'severity': v.get('severity', 'unknown')}
            for k, v in metrics.items()
        ]
        
        audit_id = f"audit_{datetime.now().timestamp()}"
        
        if db:
            db.collection('audit_results').document(audit_id).set({
                'upload_id': upload_id,
                'metrics': metrics,
                'summary': {
                    'critical_violations': critical,
                    'warnings': warnings,
                    'overall_score': max(0, 1 - (critical * 0.3 + warnings * 0.1))
                },
                'heatmap': heatmap,
                'created_at': datetime.now().isoformat()
            })
        
        return jsonify({
            'audit_id': audit_id,
            'metrics': metrics,
            'summary': {
                'critical_violations': critical,
                'warnings': warnings,
                'overall_score': max(0, 1 - (critical * 0.3 + warnings * 0.1))
            },
            'heatmap': heatmap,
            'status': 'success'
        })
        
    except Exception as e:
        logger.error(f"Audit error: {e}")
        return jsonify({'error': str(e)}), 500

@functions_framework.http
def generate_insights(request):
    """Generate AI insights."""
    from flask import jsonify
    
    try:
        data = request.get_json(silent=True) or {}
        audit_id = data.get('audit_id', 'demo')
        metrics = data.get('metrics', {})
        summary = data.get('summary', {'overall_score': 0.75})
        
        # Try Gemini if available
        if gemini_model:
            try:
                prompt = f"Analyze fairness metrics: {json.dumps({'metrics': metrics, 'summary': summary})}"
                prompt += "\nProvide summary, issues, and recommendations."
                response = gemini_model.generate_content(prompt)
                return jsonify({
                    'insights': response.text,
                    'source': 'gemini'
                })
            except Exception as e:
                logger.warning(f"Gemini error: {e}")
        
        # Fallback
        return jsonify({
            'insights': generate_fallback_insights(metrics, summary),
            'source': 'fallback'
        })
        
    except Exception as e:
        logger.error(f"Insights error: {e}")
        return jsonify({'error': str(e)}), 500

@functions_framework.http
def what_if_chat(request):
    """What-if chat."""
    from flask import jsonify
    
    try:
        data = request.get_json(silent=True) or {}
        question = data.get('question', '')
        
        if not question:
            return jsonify({'error': 'No question'}), 400
        
        if gemini_model:
            try:
                prompt = f"You are a fairness expert. Question: {question}\nAnswer helpfully."
                response = gemini_model.generate_content(prompt)
                return jsonify({'answer': response.text, 'source': 'gemini'})
            except: pass
        
        # Fallback responses
        q = question.lower()
        if 'remove' in q or 'drop' in q:
            answer = "Removing protected attributes can help, but check for proxy discrimination through correlated features."
        elif 'improve' in q or 'fix' in q:
            answer = "Consider: 1) Rebalancing data, 2) Fairness constraints during training, 3) Post-processing calibration."
        else:
            answer = "Run a fairness audit first, then ask specific questions about the results."
        
        return jsonify({'answer': answer, 'source': 'fallback'})
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({'error': str(e)}), 500

@functions_framework.http
def generate_report(request):
    """Generate compliance report."""
    from flask import jsonify
    
    try:
        data = request.get_json(silent=True) or {}
        audit_id = data.get('audit_id', 'demo')
        format_type = data.get('format', 'markdown')
        metrics = data.get('metrics', {})
        summary = data.get('summary', {})
        
        report_lines = [
            "# FairLens Compliance Report",
            f"**Audit ID:** {audit_id}",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "",
            "---",
            "",
            "## Executive Summary",
            "",
            f"**Fairness Score:** {summary.get('overall_score', 0):.0%}",
            f"**Critical Issues:** {summary.get('critical_violations', 0)}",
            "",
            "---",
            "",
            "## Findings",
            ""
        ]
        
        for attr, m in metrics.items():
            report_lines.extend([
                f"### {attr.title()}",
                f"- Disparate Impact: {m.get('disparate_impact', 0):.4f}",
                f"- Severity: {m.get('severity', 'unknown').upper()}",
                ""
            ])
        
        report_lines.extend([
            "---",
            "",
            "## Recommendations",
            "",
            "1. Review all critical violations",
            "2. Analyze root causes in training data",
            "3. Consider fairness-aware training",
            "",
            "*Generated by FairLens AI*"
        ])
        
        report = "\n".join(report_lines)
        
        if not gemini_model:
            report += "\n\n---\n*Add GEMINI_API_KEY for AI reports*"
        
        return jsonify({
            'report': report,
            'format': format_type,
            'audit_id': audit_id,
            'status': 'success'
        })
        
    except Exception as e:
        logger.error(f"Report error: {e}")
        return jsonify({'error': str(e)}), 500

@functions_framework.http
def api(request):
    """Unified API endpoint."""
    from flask import jsonify
    
    path = request.path.strip('/')
    method = path.split('/')[-1] if '/' in path else path
    
    handlers = {
        'upload': upload_dataset,
        'audit': run_audit,
        'insights': generate_insights,
        'chat': what_if_chat,
        'report': generate_report
    }
    
    handler = handlers.get(method, lambda r: jsonify({'error': 'Not found'}), 404)
    return handler(request)