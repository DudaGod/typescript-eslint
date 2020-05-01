import {
  expectToBeBlockScope,
  expectToBeCatchScope,
  expectToBeFunctionScope,
  expectToBeGlobalScope,
} from '../util/expect';
import { parse } from '../util/parse';
import { analyze } from '../../src/analyze';

describe('catch', () => {
  it('creates scope', () => {
    const ast = parse(`
            (function () {
                try {
                } catch (e) {
                }
            }());
        `);

    const scopeManager = analyze(ast);

    expect(scopeManager.scopes).toHaveLength(5);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[2];
    expectToBeBlockScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[3];
    expectToBeCatchScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('e');
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[4];
    expectToBeBlockScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
  });
});
