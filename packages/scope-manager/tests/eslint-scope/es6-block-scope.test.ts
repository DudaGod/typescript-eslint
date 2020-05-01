import {
  expectToBeBlockScope,
  expectToBeFunctionScope,
  expectToBeGlobalScope,
} from '../util/expect';
import { parse } from '../util/parse';
import { analyze } from '../../src/analyze';

describe('ES6 block scope', () => {
  it('let is materialized in ES6 block scope#1', () => {
    const ast = parse(`
            {
                let i = 20;
                i;
            }
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2); // Program and BlockStatement scope.

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0); // No variable in Program scope.

    scope = scopeManager.scopes[1];
    expectToBeBlockScope(scope);
    expect(scope.variables).toHaveLength(1); // `i` in block scope.
    expect(scope.variables[0].name).toBe('i');
    expect(scope.references).toHaveLength(2);
    expect(scope.references[0].identifier.name).toBe('i');
    expect(scope.references[1].identifier.name).toBe('i');
  });

  it('function delaration is materialized in ES6 block scope', () => {
    const ast = parse(`
            {
                function test() {
                }
                test();
            }
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(3);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeBlockScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('test');
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].identifier.name).toBe('test');

    scope = scopeManager.scopes[2];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(0);
  });

  it('let is not hoistable#1', () => {
    const ast = parse(`
            var i = 42; (1)
            {
                i;  // (2) ReferenceError at runtime.
                let i = 20;  // (2)
                i;  // (2)
            }
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('i');
    expect(scope.references).toHaveLength(1);

    scope = scopeManager.scopes[1];
    expectToBeBlockScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('i');
    expect(scope.references).toHaveLength(3);
    expect(scope.references[0].resolved).toBe(scope.variables[0]);
    expect(scope.references[1].resolved).toBe(scope.variables[0]);
    expect(scope.references[2].resolved).toBe(scope.variables[0]);
  });

  it('let is not hoistable#2', () => {
    const ast = parse(`
            (function () {
                var i = 42; // (1)
                i;  // (1)
                {
                    i;  // (3)
                    {
                        i;  // (2)
                        let i = 20;  // (2)
                        i;  // (2)
                    }
                    let i = 30;  // (3)
                    i;  // (3)
                }
                i;  // (1)
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(4);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(2);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('i');
    const v1 = scope.variables[1];

    expect(scope.references).toHaveLength(3);
    expect(scope.references[0].resolved).toBe(v1);
    expect(scope.references[1].resolved).toBe(v1);
    expect(scope.references[2].resolved).toBe(v1);

    scope = scopeManager.scopes[2];
    expectToBeBlockScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('i');
    const v3 = scope.variables[0];

    expect(scope.references).toHaveLength(3);
    expect(scope.references[0].resolved).toBe(v3);
    expect(scope.references[1].resolved).toBe(v3);
    expect(scope.references[2].resolved).toBe(v3);

    scope = scopeManager.scopes[3];
    expectToBeBlockScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('i');
    const v2 = scope.variables[0];

    expect(scope.references).toHaveLength(3);
    expect(scope.references[0].resolved).toBe(v2);
    expect(scope.references[1].resolved).toBe(v2);
    expect(scope.references[2].resolved).toBe(v2);
  });
});
