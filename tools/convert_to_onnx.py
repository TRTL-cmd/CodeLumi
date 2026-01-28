#!/usr/bin/env python3
"""Convert a trained sklearn Pipeline saved by joblib into ONNX format.
Usage:
  python tools/convert_to_onnx.py models/reranker.joblib models/reranker.onnx

This uses `skl2onnx` to convert the pipeline. It expects the pipeline to accept a single string input.
"""
import sys
import os

if len(sys.argv) < 3:
    print('Usage: python tools/convert_to_onnx.py <in.joblib> <out.onnx>', file=sys.stderr)
    sys.exit(2)

infile = sys.argv[1]
outfile = sys.argv[2]

if not os.path.exists(infile):
    print('Input model not found:', infile, file=sys.stderr)
    sys.exit(3)

try:
    import joblib
    from skl2onnx import convert_sklearn
    from skl2onnx.common.data_types import StringTensorType
except Exception as e:
    print('Missing conversion dependencies. Install with: pip install skl2onnx onnx onnxruntime', file=sys.stderr)
    print('Error:', e, file=sys.stderr)
    sys.exit(4)

pipe = joblib.load(infile)

# Define initial type for a single-column string input named 'input'
initial_type = [('input', StringTensorType([None, 1]))]
try:
    onx = convert_sklearn(pipe, initial_types=initial_type)
    with open(outfile, 'wb') as f:
        f.write(onx.SerializeToString())
    print('Converted to ONNX:', outfile)
except Exception as e:
    print('Conversion failed:', e, file=sys.stderr)
    sys.exit(5)
