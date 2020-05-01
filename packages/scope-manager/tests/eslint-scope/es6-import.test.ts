import { parse } from '../util/parse';
import {
  expectToBeGlobalScope,
  expectToBeImportBindingDefinition,
  expectToBeModuleScope,
} from '../util/expect';
import { analyze } from '../../src/analyze';

describe('import declaration', () => {
  // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-static-and-runtme-semantics-module-records
  it('should import names from source', () => {
    const ast = parse('import v from "mod";');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.isStrict).toBeTruthy();
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('v');
    expectToBeImportBindingDefinition(scope.variables[0].defs[0]);
    expect(scope.references).toHaveLength(0);
  });

  it('should import namespaces', () => {
    const ast = parse('import * as ns from "mod";');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.isStrict).toBeTruthy();
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('ns');
    expectToBeImportBindingDefinition(scope.variables[0].defs[0]);
    expect(scope.references).toHaveLength(0);
  });

  it('should import insided names#1', () => {
    const ast = parse('import {x} from "mod";');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.isStrict).toBeTruthy();
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('x');
    expectToBeImportBindingDefinition(scope.variables[0].defs[0]);
    expect(scope.references).toHaveLength(0);
  });

  it('should import insided names#2', () => {
    const ast = parse('import {x as v} from "mod";');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.isStrict).toBeTruthy();
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('v');
    expectToBeImportBindingDefinition(scope.variables[0].defs[0]);
    expect(scope.references).toHaveLength(0);
  });

  // TODO: Should parse it.
  // import from "mod";
});
