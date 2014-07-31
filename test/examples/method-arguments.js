var a = {
  echo: function(c) {
    return c;
  }
};

assert.strictEqual(a.echo(1), 1);
