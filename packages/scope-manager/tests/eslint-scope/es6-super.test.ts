import { parse } from './util/parse';
import {
  expectToBeClassScope,
  expectToBeFunctionScope,
  expectToBeGlobalScope,
} from './util/expect';
import { analyze } from '../../src/analyze';

describe('ES6 super', () => {
  it('is not handled as reference', () => {
    const ast = parse(`
            class Foo extends Bar {
                constructor() {
                    super();
                }

                method() {
                    super.method();
                }
            }
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(4);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('Foo');
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].identifier.name).toBe('Bar');

    scope = scopeManager.scopes[1];
    expectToBeClassScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('Foo');
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[2];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(0); // super is specially handled like `this`.

    scope = scopeManager.scopes[3];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(0); // super is specially handled like `this`.
  });
});
