import { TSESTree } from '@typescript-eslint/experimental-utils';
import { parse } from './util/parse';
import { analyze } from '../../src/analyze';

describe('fallback option', () => {
  it('should raise an error when it encountered an unknown node if no fallback.', () => {
    const ast = parse(`
            var foo = 0;
        `);

    const decl = ast.body[0] as TSESTree.VariableDeclaration;
    decl.declarations[0].init!.type = 'NumericLiteral' as never;

    expect(() => {
      analyze(ast, { fallback: 'none' });
    }).toThrow('Unknown node type NumericLiteral');
  });

  it('should not raise an error even if it encountered an unknown node when fallback is iteration.', () => {
    const ast = parse(`
            var foo = 0;
        `);

    const decl = ast.body[0] as TSESTree.VariableDeclaration;
    decl.declarations[0].init!.type = 'NumericLiteral' as never;

    analyze(ast); // default is `fallback: "iteration"`
    analyze(ast, { fallback: 'iteration' });
  });

  it('should not raise an error even if it encountered an unknown node when fallback is a function.', () => {
    const ast = parse(`
            var foo = 0;
        `);

    const decl = ast.body[0] as TSESTree.VariableDeclaration;
    decl.declarations[0].init!.type = 'NumericLiteral' as never;

    analyze(ast, { fallback: node => Object.keys(node) });
  });
});
