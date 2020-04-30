import { AST_NODE_TYPES } from '@typescript-eslint/experimental-utils';
import { analyze } from '../../src/analyze';

describe('object expression', () => {
  it("doesn't require property type", () => {
    // Hard-coded AST. Parser adds an extra "Property"
    // key/value to ObjectExpressions, so we're not using
    // it parse a program string.
    const ast = {
      type: AST_NODE_TYPES.Program,
      body: [
        {
          type: AST_NODE_TYPES.VariableDeclaration,
          declarations: [
            {
              type: AST_NODE_TYPES.VariableDeclarator,
              id: {
                type: AST_NODE_TYPES.Identifier,
                name: 'a',
              },
              init: {
                type: AST_NODE_TYPES.ObjectExpression,
                properties: [
                  {
                    kind: 'init',
                    key: {
                      type: AST_NODE_TYPES.Identifier,
                      name: 'foo',
                    },
                    value: {
                      type: AST_NODE_TYPES.Identifier,
                      name: 'a',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const scope = analyze(ast as never).scopes[0];

    expect(scope.variables).toHaveLength(1);
    expect(scope.references).toHaveLength(2);
    expect(scope.variables[0].name).toBe('a');
    expect(scope.references[0].identifier.name).toBe('a');
    expect(scope.references[1].identifier.name).toBe('a');
  });
});
