import {
  TSESTree,
  AST_NODE_TYPES,
} from '@typescript-eslint/experimental-utils';
import { Referencer } from './Referencer';
import { Visitor } from './Visitor';
import { TypeDefinition } from '../definition';

class TypeReferencer extends Visitor {
  public readonly referencer: Referencer;

  constructor(referencer: Referencer) {
    super(null, referencer.options);
    this.referencer = referencer;
  }

  visitTypeDeclaration(
    name: TSESTree.Identifier,
    node:
      | TSESTree.TSTypeParameter
      | TSESTree.TSInterfaceDeclaration
      | TSESTree.TSTypeAliasDeclaration,
  ): void {
    this.referencer
      .currentScope()
      .defineIdentifier(name, new TypeDefinition(name, node));

    this.visitChildren(node);
  }

  TSTypeParameter(node: TSESTree.TSTypeParameter): void {
    // generic type parameter decls, and inferred generic type parameters
    this.visitTypeDeclaration(node.name, node);
  }
  TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration): void {
    this.visitTypeDeclaration(node.id, node);
  }
  TSInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration): void {
    this.visitTypeDeclaration(node.id, node);
  }

  Identifier(node: TSESTree.Identifier): void {
    this.referencer.currentScope().referenceType(node);
  }

  // a type query `typeof foo` is a special case that references a _non-type_ variable,
  TSTypeQuery(node: TSESTree.TSTypeQuery): void {
    if (node.exprName.type === AST_NODE_TYPES.Identifier) {
      this.referencer.currentScope().referenceValue(node.exprName);
    } else {
      let expr = node.exprName.left;
      while (expr.type !== AST_NODE_TYPES.Identifier) {
        expr = expr.left;
      }
      this.referencer.currentScope().referenceValue(expr);
    }
  }

  TSQualifiedName(node: TSESTree.TSQualifiedName): void {
    this.visit(node.left);
    // we don't visit the right as it a name
  }
}

export { TypeReferencer };
