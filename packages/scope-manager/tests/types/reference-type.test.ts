import { AST_NODE_TYPES } from '@typescript-eslint/experimental-utils';
import { getSpecificNode, parseAndAnalyze } from '../util';

describe('referencing a type - positive', () => {
  it('records a reference when a type is referenced from a type', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      type TypeDecl = string;
      type OtherType = TypeDecl;
    `);
    const node = getSpecificNode(
      ast,
      AST_NODE_TYPES.TSTypeAliasDeclaration,
      n => (n.id.name === 'TypeDecl' ? n : null),
    );
    const variable = scopeManager.getDeclaredVariables(node)[0];

    expect(variable.references).toHaveLength(1);
    const referencingNode = getSpecificNode(
      ast,
      AST_NODE_TYPES.TSTypeAliasDeclaration,
      n => (n.id.name === 'OtherType' ? n : null),
    );
    expect(variable.references[0].identifier.parent?.parent).toBe(
      referencingNode,
    );
  });

  it('records a reference when a dual value-type is referenced from a type', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      class Class {}
      type Type = Class;
    `);
    const node = getSpecificNode(ast, AST_NODE_TYPES.ClassDeclaration);
    const variable = scopeManager.getDeclaredVariables(node)[0];

    expect(variable.references).toHaveLength(1);
    const referencingNode = getSpecificNode(
      ast,
      AST_NODE_TYPES.TSTypeAliasDeclaration,
    );
    expect(variable.references[0].identifier.parent?.parent).toBe(
      referencingNode,
    );
  });

  it('records a reference when a generic type parameter is referenced from its type', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      type TypeDecl<TypeParam> = TypeParam;
    `);
    const node = getSpecificNode(ast, AST_NODE_TYPES.TSTypeParameter);
    const variable = scopeManager.getDeclaredVariables(node)[0];

    expect(variable.references).toHaveLength(1);
    const referencingNode = getSpecificNode(
      ast,
      AST_NODE_TYPES.TSTypeReference,
    );
    expect(variable.references[0].identifier.parent).toBe(referencingNode);
  });
});

describe('referencing a type - negative', () => {
  it('does not record a reference when a value is referenced from a type', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      const value = 1;
      type Type = value;
    `);
    const node = getSpecificNode(ast, AST_NODE_TYPES.VariableDeclarator);
    const variable = scopeManager.getDeclaredVariables(node)[0];

    // variables declare a reference to themselves if they have an initialization
    // so there should be one reference from the declaration itself
    expect(variable.references).toHaveLength(1);
    expect(variable.references[0].identifier.parent).toBe(node);
  });

  it('does not record a reference when a type is referenced from a value', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      type Type = 1;
      const value = Type;
    `);
    const node = getSpecificNode(ast, AST_NODE_TYPES.TSTypeAliasDeclaration);
    const variable = scopeManager.getDeclaredVariables(node)[0];
    expect(variable.references).toHaveLength(0);
  });

  it('does not record a reference when a type is referenced from outside its declaring type', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      type TypeDecl<TypeParam> = T;
      type Other = TypeParam;
    `);
    const node = getSpecificNode(ast, AST_NODE_TYPES.TSTypeParameter);
    const variable = scopeManager.getDeclaredVariables(node)[0];
    expect(variable.references).toHaveLength(0);
  });
});
