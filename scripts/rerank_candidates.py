#!/usr/bin/env python3
"""
Simple wrapper to rerank candidate texts using a trained sklearn-style reranker saved with joblib.

Input (stdin or first arg) JSON: {"query": "...", "candidates": ["text1","text2", ...]}
Output (stdout) JSON: {"scores": [float,...]} matching candidates order.

This script attempts to load `training/reranker.joblib` from the project root.
If the model exposes `predict_proba` it will use that; otherwise `decision_function` or `predict`.
"""
import sys
import json
import os

def main():
    try:
        data_raw = sys.stdin.read().strip()
        if not data_raw and len(sys.argv) > 1:
            data_raw = sys.argv[1]
        if not data_raw:
            print(json.dumps({"error":"no input"}))
            return
        data = json.loads(data_raw)
        query = data.get('query','')
        candidates = data.get('candidates', [])
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        return

    # Try multiple likely locations for the joblib model
    candidates = [
        os.path.join(os.getcwd(), 'training', 'reranker.joblib'),
        os.path.join(os.getcwd(), 'models', 'reranker.joblib'),
        os.path.join(os.getcwd(), 'reranker.joblib'),
    ]
    model_path = None
    for c in candidates:
        if os.path.exists(c):
            model_path = c
            break
    if model_path is None:
        print(json.dumps({"error":"model_not_found", "checked": candidates}))
        return

    try:
        from joblib import load
        model = load(model_path)
    except Exception as e:
        print(json.dumps({"error": f"load_error: {e}", "path": model_path}))
        return

    # Prepare inputs matching tools/infer_reranker.py: pass a list of strings "query \n candidate"
    X = [query + ' \n ' + c for c in candidates]
    scores = None
    try:
        # try predict_proba
        if hasattr(model, 'predict_proba'):
            probs = model.predict_proba(X)
            # take max class prob or second column if binary
            if hasattr(probs, 'shape') and probs.shape[1] >= 2:
                scores = [float(p[1]) for p in probs]
            else:
                scores = [float(max(p)) for p in probs]
        elif hasattr(model, 'decision_function'):
            df = model.decision_function(X)
            # ensure list
            scores = [float(x) for x in df]
        elif hasattr(model, 'predict'):
            preds = model.predict(X)
            scores = [float(x) for x in preds]
        else:
            print(json.dumps({"error":"model_has_no_scoring_method"}))
            return
    except Exception as e:
        print(json.dumps({"error": f"scoring_error: {e}"}))
        return

    print(json.dumps({"scores": scores}))

if __name__ == '__main__':
    main()
