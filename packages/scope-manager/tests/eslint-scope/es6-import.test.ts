import { parse } from '../util/parse';
import {
  expectToBeGlobalScope,
  expectToBeImportBindingDefinition,
  expectToBeModuleScope,
  expectToBeVariableDefinition,
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

  it('should reference imports', () => {
    const imports = [
      'import v from "mod";',
      'import { v } from "mod";',
      'import * as v from "mod";',
    ];
    for (const code of imports) {
      const ast = parse(`
        ${code}
        const x = v;
      `);

      const scopeManager = analyze(ast, {
        ecmaVersion: 6,
        sourceType: 'module',
      });

      expect(scopeManager.scopes).toHaveLength(2);

      let scope = scopeManager.scopes[0];
      expectToBeGlobalScope(scope);
      expect(scope.variables).toHaveLength(0);
      expect(scope.references).toHaveLength(0);

      scope = scopeManager.scopes[1];
      expectToBeModuleScope(scope);
      expect(scope.isStrict).toBeTruthy();
      expect(scope.variables).toHaveLength(2);
      const importV = scope.variables[0];
      expect(importV.name).toBe('v');
      expectToBeImportBindingDefinition(importV.defs[0]);
      const variableX = scope.variables[1];
      expect(variableX.name).toBe('x');
      expectToBeVariableDefinition(variableX.defs[0]);

      expect(scope.references).toHaveLength(2);
      expect(scope.references[0].resolved).toBe(variableX);
      expect(scope.references[1].resolved).toBe(importV);
    }
  });
});
