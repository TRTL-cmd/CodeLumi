#!/usr/bin/env python3
"""
Train a simple TF-IDF + LogisticRegression reranker from exported JSONL training data.
Usage:
  python3 tools/train_reranker.py training.jsonl model_out.joblib

Input format: each line JSON {"input": "question text", "output": "answer text"}
This script creates negative samples by pairing questions with other outputs in the dataset.
"""
import sys, json, random
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib

if len(sys.argv) < 3:
    print("Usage: python3 tools/train_reranker.py training.jsonl model_out.joblib", file=sys.stderr)
    sys.exit(2)

src = sys.argv[1]
outfile = sys.argv[2]

pairs = []
with open(src,'r',encoding='utf8') as f:
    for line in f:
        line=line.strip()
        if not line: continue
        try:
            obj = json.loads(line)
            q = obj.get('input','').strip()
            a = obj.get('output','').strip()
            if q and a:
                pairs.append((q,a))
        except Exception as e:
            continue

if len(pairs) < 3:
    print('Not enough pairs to train', file=sys.stderr)
    sys.exit(2)

# Build negative samples by pairing questions with random other answers
neg = []
for i,(q,a) in enumerate(pairs):
    other = random.choice(pairs)[1]
    tries=0
    while other==a and tries<5:
        other = random.choice(pairs)[1]; tries+=1
    neg.append((q, other))

X_text = []
y = []
for q,a in pairs:
    X_text.append(q + ' \n ' + a)
    y.append(1)
for q,a in neg:
    X_text.append(q + ' \n ' + a)
    y.append(0)

# Train pipeline
pipe = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1,2), max_features=20000)),
    ('clf', LogisticRegression(max_iter=1000))
])
print('Training on', len(X_text), 'examples')
pipe.fit(X_text, y)
joblib.dump(pipe, outfile)
print('Saved model to', outfile)
