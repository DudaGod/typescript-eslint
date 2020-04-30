import { parse } from './util/parse';
import { analyze } from '../../src/analyze';
import { expectToBeFunctionScope, expectToBeGlobalScope } from './util/expect';

describe('typescript', () => {
  describe('multiple call signatures', () => {
    it('should create a function scope', () => {
      const ast = parse(`
                function foo(bar: number): number;
                function foo(bar: string): string;
                function foo(bar: string | number): string | number {
                    return bar;
                }
            `);

      const scopeManager = analyze(ast);

      expect(scopeManager.scopes).toHaveLength(2);

      let scope = scopeManager.scopes[0];
      expectToBeGlobalScope(scope);
      expect(scope.variables).toHaveLength(1);
      expect(scope.references).toHaveLength(4);
      expect(scope.isArgumentsMaterialized()).toBeTruthy();

      scope = scopeManager.scopes[1];
      expectToBeFunctionScope(scope);
      expect(scope.variables).toHaveLength(2);
      expect(scope.variables[0].name).toBe('arguments');
      expect(scope.isArgumentsMaterialized()).toBeFalsy();
      expect(scope.references).toHaveLength(1);
    });
  });
});
