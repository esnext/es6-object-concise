var a = {
  b() {
    return typeof b;
  }
};

assert.equal(a.b(), 'undefined');
