import { TSESTree } from '@typescript-eslint/experimental-utils';
import { parse } from './util/parse';
import { analyze } from '../../src/analyze';

describe('childVisitorKeys option', () => {
  it('should handle as a known node if the childVisitorKeys option was given.', () => {
    const ast = parse(`
            var foo = 0;
        `);

    const decl = ast.body[0] as TSESTree.VariableDeclaration;
    decl.declarations[0].init!.type = 'NumericLiteral' as never;

    // should no error
    analyze(ast, {
      fallback: 'none',
      childVisitorKeys: {
        NumericLiteral: [],
      },
    });
  });

  it('should not visit to properties which are not given.', () => {
    const ast = parse(`
            let foo = bar;
        `);

    const decl = ast.body[0] as TSESTree.VariableDeclaration;
    decl.declarations[0].init = {
      type: 'TestNode',
      argument: decl.declarations[0].init,
    } as never;

    const result = analyze(ast, {
      childVisitorKeys: {
        TestNode: [],
      },
    });

    expect(result.scopes).toHaveLength(1);
    const globalScope = result.scopes[0];

    // `bar` in TestNode has not been visited.
    expect(globalScope.through).toHaveLength(0);
  });

  it('should visit to given properties.', () => {
    const ast = parse(`
            let foo = bar;
        `);

    const decl = ast.body[0] as TSESTree.VariableDeclaration;
    decl.declarations[0].init = {
      type: 'TestNode',
      argument: decl.declarations[0].init,
    } as never;

    const result = analyze(ast, {
      childVisitorKeys: {
        TestNode: ['argument'],
      },
    });

    expect(result.scopes).toHaveLength(1);
    const globalScope = result.scopes[0];

    // `bar` in TestNode has been visited.
    expect(globalScope.through).toHaveLength(1);
    expect(globalScope.through[0].identifier.name).toBe('bar');
  });
});
