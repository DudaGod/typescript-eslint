import {
  expectToBeFunctionExpressionNameScope,
  expectToBeFunctionScope,
  expectToBeGlobalScope,
} from '../util/expect';
import { parse } from '../util/parse';
import { analyze } from '../../src/analyze';

describe('function name', () => {
  it('should create its special scope', () => {
    const ast = parse(`
            (function name() {
            }());
        `);

    const scopeManager = analyze(ast);

    expect(scopeManager.scopes).toHaveLength(3);

    let scope = scopeManager.scopes[0];
    const globalScope = scope;
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    // Function expression name scope
    scope = scopeManager.scopes[1];
    expectToBeFunctionExpressionNameScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('name');
    expect(scope.references).toHaveLength(0);
    expect(scope.upper === globalScope).toBeTruthy();

    // Function scope
    scope = scopeManager.scopes[2];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(0);
    expect(scope.upper === scopeManager.scopes[1]).toBeTruthy();
  });
});
