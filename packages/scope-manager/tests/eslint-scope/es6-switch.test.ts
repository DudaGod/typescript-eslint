import { AST_NODE_TYPES } from '@typescript-eslint/experimental-utils';
import { parse } from './util/parse';
import { analyze } from '../../src/analyze';
import { expectToBeGlobalScope, expectToBeSwitchScope } from './util/expect';

describe('ES6 switch', () => {
  it('materialize scope', () => {
    const ast = parse(`
            switch (ok) {
                case hello:
                    let i = 20;
                    i;
                    break;

                default:
                    let test = 30;
                    test;
            }
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].identifier.name).toBe('ok');

    scope = scopeManager.scopes[1];
    expectToBeSwitchScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.SwitchStatement);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(2);
    expect(scope.variables[0].name).toBe('i');
    expect(scope.variables[1].name).toBe('test');
    expect(scope.references).toHaveLength(5);
    expect(scope.references[0].identifier.name).toBe('hello');
    expect(scope.references[1].identifier.name).toBe('i');
    expect(scope.references[2].identifier.name).toBe('i');
    expect(scope.references[3].identifier.name).toBe('test');
    expect(scope.references[4].identifier.name).toBe('test');
  });
});
