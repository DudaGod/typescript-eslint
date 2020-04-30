import { AST_NODE_TYPES } from '@typescript-eslint/experimental-utils';
import { expectToBeFunctionScope } from './util/expect';
import { parse } from './util/parse';
import { analyze } from '../../src/analyze';

describe('ES6 new.target', () => {
  it('should not make references of new.target', () => {
    const ast = parse(`
            class A {
                constructor() {
                    new.target;
                }
            }
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(3);

    const scope = scopeManager.scopes[2];

    expectToBeFunctionScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.FunctionExpression);
    expect(scope.isStrict).toBeTruthy();
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(0);
  });
});
