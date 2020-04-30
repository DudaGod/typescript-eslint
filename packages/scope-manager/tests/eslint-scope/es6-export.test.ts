import { parse } from './util/parse';
import { analyze } from '../../src/analyze';
import {
  expectToBeFunctionScope,
  expectToBeGlobalScope,
  expectToBeModuleScope,
} from './util/expect';
import { VariableType } from '../../src/VariableType';

describe('export declaration', () => {
  // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-static-and-runtme-semantics-module-records
  it('should create variable bindings', () => {
    const ast = parse('export var v;');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('v');
    expect(scope.variables[0].defs[0].type).toBe(VariableType.Variable);
    expect(scope.references).toHaveLength(0);
  });

  it('should create function declaration bindings', () => {
    const ast = parse('export default function f(){};');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(3);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('f');
    expect(scope.variables[0].defs[0].type).toBe(VariableType.FunctionName);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[2];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(0);
  });

  it('should export function expression', () => {
    const ast = parse('export default function(){};');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(3);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[2];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(0);
  });

  it('should export literal', () => {
    const ast = parse('export default 42;');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
  });

  it('should refer exported references#1', () => {
    const ast = parse('const x = 1; export {x};');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.references).toHaveLength(2);
    expect(scope.references[0].identifier.name).toBe('x');
    expect(scope.references[1].identifier.name).toBe('x');
  });

  it('should refer exported references#2', () => {
    const ast = parse('const v = 1; export {v as x};');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.references).toHaveLength(2);
    expect(scope.references[0].identifier.name).toBe('v');
    expect(scope.references[1].identifier.name).toBe('v');
  });

  it('should not refer exported references from other source#1', () => {
    const ast = parse('export {x} from "mod";');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
  });

  it('should not refer exported references from other source#2', () => {
    const ast = parse('export {v as x} from "mod";');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
  });

  it('should not refer exported references from other source#3', () => {
    const ast = parse('export * from "mod";');

    const scopeManager = analyze(ast, { ecmaVersion: 6, sourceType: 'module' });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeModuleScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
  });
});
