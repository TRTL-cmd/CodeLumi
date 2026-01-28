// Simple runtime test for NeuralNetwork-like behavior
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

function randomMatrix(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => (Math.random() - 0.5) * 2));
}

class SmallNN {
  constructor() {
    this.inputSize = 3;
    this.hiddenSize = 4;
    this.outputSize = 1;
    this.wih = randomMatrix(this.inputSize, this.hiddenSize);
    this.who = randomMatrix(this.hiddenSize, this.outputSize);
    this.bh = Array(this.hiddenSize).fill(0);
    this.bo = Array(this.outputSize).fill(0);
    this.lr = 0.1;
  }

  forward(x) {
    this.x = x;
    this.h = this.bh.map((b, i) => sigmoid(x.reduce((s, v, j) => s + v * this.wih[j][i], b)));
    this.y = this.bo.map((b, i) => sigmoid(this.h.reduce((s, v, j) => s + v * this.who[j][i], b)));
    return this.y;
  }

  train(x, t) {
    this.forward(x);
    const outErr = t.map((tv, i) => tv - this.y[i]);
    const outDelta = outErr.map((err, i) => err * this.y[i] * (1 - this.y[i]));
    const hidErr = this.h.map((_, i) => outDelta.reduce((s, od, j) => s + od * this.who[i][j], 0));
    const hidDelta = hidErr.map((err, i) => err * this.h[i] * (1 - this.h[i]));

    for (let i=0;i<this.hiddenSize;i++) for (let j=0;j<this.outputSize;j++) this.who[i][j] += this.lr * outDelta[j] * this.h[i];
    for (let i=0;i<this.inputSize;i++) for (let j=0;j<this.hiddenSize;j++) this.wih[i][j] += this.lr * hidDelta[j] * x[i];
    for (let i=0;i<this.outputSize;i++) this.bo[i] += this.lr * outDelta[i];
    for (let i=0;i<this.hiddenSize;i++) this.bh[i] += this.lr * hidDelta[i];

    return Math.abs(outErr.reduce((a,b)=>a+b,0));
  }
}

// Toy dataset: learn AND of first two inputs
const nn = new SmallNN();
const data = [];
for (let a of [0,1]) for (let b of [0,1]) {
  data.push({ x: [a,b,1], t: [ (a&&b)?1:0 ] });
}

let beforeLoss = 0;
for (let d of data) beforeLoss += Math.abs(d.t[0] - nn.forward(d.x)[0]);

for (let epoch=0; epoch<2000; epoch++) {
  for (let d of data) nn.train(d.x, d.t);
}

let afterLoss = 0;
for (let d of data) afterLoss += Math.abs(d.t[0] - nn.forward(d.x)[0]);

console.log('beforeLoss', beforeLoss.toFixed(4));
console.log('afterLoss', afterLoss.toFixed(4));
console.log(afterLoss < beforeLoss ? 'PASS: training reduced loss' : 'FAIL: no improvement');
