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

    // there should be one reference from the declaration itself
    expect(variable.references).toHaveLength(2);
    expect(variable.references[0].identifier.parent).toBe(node);

    // and one reference from the usage
    const otherTypeDecl = getSpecificNode(
      ast,
      AST_NODE_TYPES.TSTypeAliasDeclaration,
      n => (n.id.name === 'OtherType' ? n : null),
    );
    expect(variable.references[1].identifier.parent?.parent).toBe(
      otherTypeDecl,
    );
  });

  it('records a reference when a dual value-type is referenced from a type', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      class Class {}
      type Type = Class;
    `);
    const node = getSpecificNode(ast, AST_NODE_TYPES.ClassDeclaration);
    const variable = scopeManager.getDeclaredVariables(node)[0];

    // there should be one reference from the type declaration
    expect(variable.references).toHaveLength(1);
    const otherTypeDecl = getSpecificNode(
      ast,
      AST_NODE_TYPES.TSTypeAliasDeclaration,
    );
    expect(variable.references[0].identifier.parent?.parent).toBe(
      otherTypeDecl,
    );
  });

  it('records a reference when a generic type parameter is referenced from its type', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      type TypeDecl<TypeParam> = TypeParam;
    `);
    const node = getSpecificNode(ast, AST_NODE_TYPES.TSTypeParameter);
    const variable = scopeManager.getDeclaredVariables(node)[0];

    // there should be one reference from the declaration itself
    expect(variable.references).toHaveLength(2);
    expect(variable.references[0].identifier.parent).toBe(node);

    // and one reference from the usage
    const usage = getSpecificNode(ast, AST_NODE_TYPES.TSTypeReference);
    expect(variable.references[1].identifier.parent).toBe(usage);
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

    // there should be one reference from the declaration itself
    expect(variable.references).toHaveLength(1);
    expect(variable.references[0].identifier.parent).toBe(node);
  });

  it('does not record a reference when a type is referenced from a value', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      type Type = value;
      const value = 1;
    `);
    const node = getSpecificNode(ast, AST_NODE_TYPES.TSTypeAliasDeclaration);
    const variable = scopeManager.getDeclaredVariables(node)[0];

    // there should be one reference from the declaration itself
    expect(variable.references).toHaveLength(1);
    expect(variable.references[0].identifier.parent).toBe(node);
  });

  it.todo(
    'does not record a reference when a type is referenced from outside its declaring type',
    // () => {
    //   const { ast, scopeManager } = parseAndAnalyze(`
    //   type TypeDecl<TypeParam> = T;
    //   type Other = TypeParam;
    // `);
    //   const node = getSpecificNode(ast, AST_NODE_TYPES.TSTypeParameter);
    //   const variable = scopeManager.getDeclaredVariables(node)[0];

    //   // there should be one reference from the declaration itself
    //   expect(variable.references).toHaveLength(1);
    //   expect(variable.references[0].identifier.parent).toBe(node);
    // },
  );
});
