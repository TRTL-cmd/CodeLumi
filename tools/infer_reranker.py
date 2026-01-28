#!/usr/bin/env python3
"""Quick inference test for models/reranker (prefers ONNX if available).
Loads ONNX model with onnxruntime if `models/reranker.onnx` exists; otherwise falls back to joblib pipeline.
"""
import os
import sys
import numpy as np

ONNX_PATH = os.path.join('models', 'reranker.onnx')
JOBLIB_PATH = os.path.join('models', 'reranker.joblib')

q = "What's the state of the project?"
cands = [
    "We have a working dev flow, plan UI, and an exported KB.",
    "I cannot find any files."
]

def infer_with_onnx(onnx_path, question, candidates):
    try:
        import onnxruntime as ort
    except Exception as e:
        print('onnxruntime not installed:', e, file=sys.stderr)
        return None
    sess = ort.InferenceSession(onnx_path)
    inp_name = sess.get_inputs()[0].name
    # skl2onnx converted pipeline expects shape (N,1) string tensor
    texts = np.array([[question + ' \n ' + c] for c in candidates], dtype=object)
    try:
        out = sess.run(None, {inp_name: texts})
        # output may be probabilities or labels depending on conversion; try to find probability column
        # common convert exports probabilities as last output; attempt to parse
        if isinstance(out, (list, tuple)) and len(out) >= 1:
            arr = out[0]
            # if 2D with two columns, take column 1 as positive class
            if hasattr(arr, 'shape') and arr.shape[1] >= 2:
                probs = arr[:,1]
                return probs
            # if single column, return it
            if hasattr(arr, 'shape') and arr.shape[1] == 1:
                return arr[:,0]
        return None
    except Exception as e:
        print('ONNX inference failed:', e, file=sys.stderr)
        return None

def infer_with_joblib(joblib_path, question, candidates):
    try:
        import joblib
    except Exception as e:
        print('joblib not installed:', e, file=sys.stderr)
        return None
    pipe = joblib.load(joblib_path)
    X = [question + ' \n ' + c for c in candidates]
    try:
        probs = pipe.predict_proba(X)[:,1]
        return probs
    except Exception as e:
        print('joblib predict_proba failed:', e, file=sys.stderr)
        try:
            preds = pipe.predict(X)
            return np.array(preds, dtype=float)
        except Exception as e2:
            print('joblib fallback predict failed:', e2, file=sys.stderr)
            return None

probs = None
if os.path.exists(ONNX_PATH):
    probs = infer_with_onnx(ONNX_PATH, q, cands)
    if probs is not None:
        print('Scored using ONNX model')

if probs is None and os.path.exists(JOBLIB_PATH):
    probs = infer_with_joblib(JOBLIB_PATH, q, cands)
    if probs is not None:
        print('Scored using joblib pipeline')

if probs is None:
    print('No usable model found or inference failed', file=sys.stderr)
    sys.exit(2)

for i,c in enumerate(cands):
    print(f'Candidate {i+1}: "{c}" -> score={float(probs[i]):.4f}')

best = int(np.argmax(probs))
print('\nBest candidate:', best+1)
