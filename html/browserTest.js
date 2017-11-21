let t;

const a = (bool) => {
  if(!bool) throw new Error();
};

const c = (...b) => {
  for(let s of b) a(typeof s == 'symbol');
};

c( Symbol(), Symbol.for('foo') );
a(Symbol.keyFor(Symbol.for('foo')) == 'foo');
a(Symbol.iterator);

new Map();
new Set();
new WeakMap();
new WeakSet();
new Promise(() => {});

async function f(){
  await 1;
}

function* g(){
  yield 0;
}

t = {
  [1 + 2]: 3,
  foo(){
    return 'bar';
  },
  t
};

[t] = [1];

a(0o644 == 420);
a(0O755 == 493);
a(0B00000000011111111111111111111111 == 8388607);
a(String.fromCodePoint(112,111,116,97,116,111,101) == 'potatoe');
a('potatoe'.codePointAt(6) == 101);
a('\u1E9B\u0323'.normalize('NFKC') == 'ṩ');
a('asd'.startsWith('as'));
a('asd'.endsWith('sd'));
a('potatoe'.includes('tatoe'));
a('foo'.repeat(2) == 'foofoo');

a(window.fetch);

t = 1;
a(String.raw`
${t}` == '\n1');

a('\u{2F804}' == '你');

class F{}

(() => {
  'use strict';

  function o(){ }

  function* g(){
    return o();
  }

  let i = g();
  const s = i.next();
  const {done} = s;

  for(let i = 0;i < 5;i++){
    function b(){}
  }

  a(typeof b == "undefined");

})();
