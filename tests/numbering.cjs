const assert = require('node:assert/strict');
const {buildKitSheets} = require('../numbering.js');
const make = (changes={}) => buildKitSheets({from:1,to:165,kits:1,maxCols:4,maxRows:50,...changes});
let sheets = make();
assert.equal(sheets.length,1);
assert.equal(sheets[0].cells.length,165);
assert.deepEqual(sheets[0].cells.filter(c=>c.col===1).map(c=>c.n),Array.from({length:50},(_,i)=>51+i));
assert.equal(sheets[0].cells.at(-1).n,165);
sheets = make({kits:2});
assert.equal(sheets.flatMap(s=>s.cells).length,330);
assert.equal(sheets[0].cells[165].n,1);
assert.equal(sheets[1].cells[0].n,36);
assert.equal(sheets[1].cells.at(-1).n,165);
for(const flow of ['column','row']) for(const kits of [1,2,50]) {
  const cells = make({flow,kits,from:101,to:165}).flatMap(s=>s.cells);
  assert.equal(cells.length,65*kits);
  cells.forEach((c,i)=>assert.equal(c.n,101+i%65));
}
assert.equal(make({from:101,fill:true})[0].cells[65].n,101);
assert.equal(make({fill:true,fillMode:'continue'})[0].cells.at(-1).n,200);
assert.equal(make({from:0,to:0,kits:50}).flatMap(s=>s.cells).length,50);
assert.throws(()=>make({kits:51}),RangeError);
console.log('Numbering checks passed');
