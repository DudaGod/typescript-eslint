import { AST_NODE_TYPES } from '@typescript-eslint/experimental-utils';
import {
  expectToBeBlockScope,
  expectToBeCatchScope,
  expectToBeGlobalScope,
} from '../util/expect';
import { parse } from '../util/parse';
import { analyze } from '../../src/analyze';

describe('ES6 catch', () => {
  it('takes binding pattern', () => {
    const ast = parse(`
            try {
            } catch ({ a, b, c, d }) {
                let e = 20;
                a;
                b;
                c;
                d;
            }
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(4);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeBlockScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.BlockStatement);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[2];
    expectToBeCatchScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.CatchClause);
    expect(scope.isStrict).toBeFalsy();

    expect(scope.variables).toHaveLength(4);
    expect(scope.variables[0].name).toBe('a');
    expect(scope.variables[1].name).toBe('b');
    expect(scope.variables[2].name).toBe('c');
    expect(scope.variables[3].name).toBe('d');
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[3];
    expectToBeBlockScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.BlockStatement);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables.map(variable => variable.name)).toEqual(['e']);
    expect(scope.references.map(ref => ref.identifier.name)).toEqual([
      'e',
      'a',
      'b',
      'c',
      'd',
    ]);
  });
});
