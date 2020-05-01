import { AST_NODE_TYPES } from '@typescript-eslint/experimental-utils';
import {
  expectToBeFunctionScope,
  expectToBeGlobalScope,
  expectToBeIdentifier,
  expectToBeParameterDefinition,
} from '../util/expect';
import { parse } from '../util/parse';
import { analyze } from '../../src/analyze';

describe('ES6 rest arguments', () => {
  it('materialize rest argument in scope', () => {
    const ast = parse(`
            function foo(...bar) {
                return bar;
            }
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(1);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(2);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('bar');
    expectToBeIdentifier(scope.variables[1].defs[0].name);
    expect(scope.variables[1].defs[0].name.name).toBe('bar');
    expectToBeParameterDefinition(scope.variables[1].defs[0]);
    expect(scope.variables[1].defs[0].rest).toBeTruthy();
  });
});
