import { AST_NODE_TYPES } from '@typescript-eslint/experimental-utils';
import { getSpecificNode, parseAndAnalyze } from '../util';

describe('variable definition', () => {
  it('defines a variable for a type declaration', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      type TypeDecl = string;
    `);
    const node = getSpecificNode(ast, AST_NODE_TYPES.TSTypeAliasDeclaration);
    expect(scopeManager.getDeclaredVariables(node)).toMatchInlineSnapshot(`
      Array [
        Variable$1 {
          defs: Array [
            TypeDefinition$1 {
              name: Identifier<"TypeDecl">,
              node: TSTypeAliasDeclaration$1 {
                id: Identifier<"TypeDecl">,
                typeAnnotation: TSStringKeyword,
              },
            },
          ],
          identifiers: Array [
            Identifier<"TypeDecl">,
          ],
          name: "TypeDecl",
          references: Array [
            Reference$1 {
              identifier: Identifier<"TypeDecl">,
              resolved: Variable$1,
            },
          ],
        },
      ]
    `);
  });

  it('defines a variable for an interface definition', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      interface InterfaceDecl {
        prop: string;
      }
    `);
    const node = getSpecificNode(ast, AST_NODE_TYPES.TSInterfaceDeclaration);
    expect(scopeManager.getDeclaredVariables(node)).toMatchInlineSnapshot(`
      Array [
        Variable$1 {
          defs: Array [
            TypeDefinition$1 {
              name: Identifier<"InterfaceDecl">,
              node: TSInterfaceDeclaration$4 {
                body: TSInterfaceBody$3 {
                  body: Array [
                    TSPropertySignature$2 {
                      computed: false,
                      key: Identifier<"prop">,
                      typeAnnotation: TSTypeAnnotation$1 {
                        typeAnnotation: TSStringKeyword,
                      },
                    },
                  ],
                },
                id: Identifier<"InterfaceDecl">,
              },
            },
          ],
          identifiers: Array [
            Identifier<"InterfaceDecl">,
          ],
          name: "InterfaceDecl",
          references: Array [
            Reference$2 {
              identifier: Identifier<"InterfaceDecl">,
              resolved: Variable$1,
            },
          ],
        },
      ]
    `);
  });

  it('defines a variable for a generic type', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      type TypeDecl<TypeParam> = string;
    `);
    const node = getSpecificNode(ast, AST_NODE_TYPES.TSTypeParameter);
    expect(scopeManager.getDeclaredVariables(node)).toMatchInlineSnapshot(`
      Array [
        Variable$2 {
          defs: Array [
            TypeDefinition$2 {
              name: Identifier<"TypeParam">,
              node: TSTypeParameter$1 {
                name: Identifier<"TypeParam">,
              },
            },
          ],
          identifiers: Array [
            Identifier<"TypeParam">,
          ],
          name: "TypeParam",
          references: Array [
            Reference$2 {
              identifier: Identifier<"TypeParam">,
              resolved: Variable$2,
            },
          ],
        },
      ]
    `);
  });

  it('defines a variable for an inferred generic type', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      type TypeDecl<TypeParam> = TypeParam extends Foo<infer Inferred> ? Inferred : never;
    `);
    const node = getSpecificNode(
      ast,
      AST_NODE_TYPES.TSInferType,
      n => n.typeParameter,
    );
    expect(scopeManager.getDeclaredVariables(node)).toMatchInlineSnapshot(`
      Array [
        Variable$2 {
          defs: Array [
            TypeDefinition$2 {
              name: Identifier<"Inferred">,
              node: TSTypeParameter$1 {
                name: Identifier<"Inferred">,
              },
            },
          ],
          identifiers: Array [
            Identifier<"Inferred">,
          ],
          name: "Inferred",
          references: Array [
            Reference$4 {
              identifier: Identifier<"Inferred">,
              resolved: Variable$2,
            },
            Reference$5 {
              identifier: Identifier<"Inferred">,
              resolved: Variable$2,
            },
          ],
        },
      ]
    `);
  });
});
