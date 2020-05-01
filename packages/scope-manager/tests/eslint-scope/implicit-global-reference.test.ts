import { expectToBeGlobalScope } from '../util/expect';
import { parse } from '../util/parse';
import { analyze } from '../../src/analyze';
import { DefinitionType } from '../../src/definition';

describe('implicit global reference', () => {
  it('assignments global scope', () => {
    const ast = parse(`
            var x = 20;
            x = 300;
        `);

    const scopes = analyze(ast).scopes;

    expect(
      scopes.map(scope =>
        scope.variables.map(variable => variable.defs.map(def => def.type)),
      ),
    ).toEqual([[[DefinitionType.Variable]]]);

    expectToBeGlobalScope(scopes[0]);
    expect(
      scopes[0]['implicit'].variables.map(variable => variable.name),
    ).toEqual([]);
  });

  it('assignments global scope without definition', () => {
    const ast = parse(`
            x = 300;
            x = 300;
        `);

    const scopes = analyze(ast).scopes;

    expect(
      scopes.map(scope =>
        scope.variables.map(variable => variable.defs.map(def => def.type)),
      ),
    ).toEqual([[]]);

    expectToBeGlobalScope(scopes[0]);
    expect(
      scopes[0]['implicit'].variables.map(variable => variable.name),
    ).toEqual(['x']);
  });

  it('assignments global scope without definition eval', () => {
    const ast = parse(`
            function inner() {
                eval(str);
                x = 300;
            }
        `);

    const scopes = analyze(ast).scopes;

    expect(
      scopes.map(scope =>
        scope.variables.map(variable => variable.defs.map(def => def.type)),
      ),
    ).toEqual([[[DefinitionType.FunctionName]], [[]]]);

    expectToBeGlobalScope(scopes[0]);
    expect(
      scopes[0]['implicit'].variables.map(variable => variable.name),
    ).toEqual(['x']);
  });

  it('assignment leaks', () => {
    const ast = parse(`
            function outer() {
                x = 20;
            }
        `);

    const scopes = analyze(ast).scopes;

    expect(
      scopes.map(scope => scope.variables.map(variable => variable.name)),
    ).toEqual([['outer'], ['arguments']]);

    expectToBeGlobalScope(scopes[0]);
    expect(
      scopes[0]['implicit'].variables.map(variable => variable.name),
    ).toEqual(['x']);
  });

  it("assignment doesn't leak", () => {
    const ast = parse(`
            function outer() {
                function inner() {
                    x = 20;
                }
                var x;
            }
        `);

    const scopes = analyze(ast).scopes;

    expect(
      scopes.map(scope => scope.variables.map(variable => variable.name)),
    ).toEqual([['outer'], ['arguments', 'inner', 'x'], ['arguments']]);

    expectToBeGlobalScope(scopes[0]);
    expect(
      scopes[0]['implicit'].variables.map(variable => variable.name),
    ).toEqual([]);
  });

  it('for-in-statement leaks', () => {
    const ast = parse(`
            function outer() {
                for (x in y) { }
            }`);

    const scopes = analyze(ast).scopes;

    expect(
      scopes.map(scope => scope.variables.map(variable => variable.name)),
    ).toEqual([['outer'], ['arguments'], []]);

    expectToBeGlobalScope(scopes[0]);
    expect(
      scopes[0]['implicit'].variables.map(variable => variable.name),
    ).toEqual(['x']);
  });

  it("for-in-statement doesn't leaks", () => {
    const ast = parse(`
            function outer() {
                function inner() {
                    for (x in y) { }
                }
                var x;
            }
        `);

    const scopes = analyze(ast).scopes;

    expect(
      scopes.map(scope => scope.variables.map(variable => variable.name)),
    ).toEqual([['outer'], ['arguments', 'inner', 'x'], ['arguments'], []]);

    expectToBeGlobalScope(scopes[0]);
    expect(
      scopes[0]['implicit'].variables.map(variable => variable.name),
    ).toEqual([]);
  });
});
