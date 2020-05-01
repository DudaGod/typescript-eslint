import { AST_NODE_TYPES } from '@typescript-eslint/experimental-utils';
import {
  expectToBeGlobalScope,
  expectToBeFunctionScope,
  expectToBeModuleScope,
  expectToBeImportBindingDefinition,
} from './util/expect';
import { parse } from './util/parse';
import { analyze } from '../../src/analyze';

describe('gloablReturn option', () => {
  it('creates a function scope following the global scope immediately', () => {
    const ast = parse(`
            "use strict";
            var hello = 20;
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6, gloablReturn: true });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBeTruthy();
    expect(scope.variables).toHaveLength(2);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('hello');
  });

  it('creates a function scope following the global scope immediately and creates module scope', () => {
    const ast = parse("import {x as v} from 'mod';");

    const scopeManager = analyze(ast, {
      ecmaVersion: 6,
      gloablReturn: true,
      sourceType: 'module',
    });

    expect(scopeManager.scopes).toHaveLength(3);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');

    scope = scopeManager.scopes[2];
    expectToBeModuleScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('v');
    expectToBeImportBindingDefinition(scope.variables[0].defs[0]);
    expect(scope.references).toHaveLength(0);
  });
});
