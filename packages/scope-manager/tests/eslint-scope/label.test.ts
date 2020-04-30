import {
  expectToBeBlockScope,
  expectToBeFunctionScope,
  expectToBeGlobalScope,
} from './util/expect';
import { parse } from './util/parse';
import { analyze } from '../../src/analyze';

describe('label', () => {
  it('should not create variables', () => {
    const ast = parse('function bar() { q: for(;;) { break q; } }');

    const scopeManager = analyze(ast);

    expect(scopeManager.scopes).toHaveLength(3);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('bar');
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.isArgumentsMaterialized()).toBeFalsy();
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[2];
    expectToBeBlockScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.isArgumentsMaterialized()).toBeTruthy();
    expect(scope.references).toHaveLength(0);
  });

  it('should count child node references', () => {
    const ast = parse(`
            var foo = 5;

            label: while (true) {
              console.log(foo);
              break;
            }
        `);

    const scopeManager = analyze(ast);

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('foo');
    expect(scope.through.length).toBe(3);
    expect(scope.through[2].identifier.name).toBe('foo');
    expect(scope.through[2].isRead()).toBeTruthy();

    scope = scopeManager.scopes[1];
    expectToBeBlockScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(2);
    expect(scope.references[0].identifier.name).toBe('console');
    expect(scope.references[1].identifier.name).toBe('foo');
  });
});
