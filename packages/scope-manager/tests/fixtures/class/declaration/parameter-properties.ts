const outer = 1;
class A {
  constructor(
    private a,
    private b = 1,
    private c = a,
    public d = outer,
    public e,
  ) {
    a;
  }
}

const unresovled = e;
