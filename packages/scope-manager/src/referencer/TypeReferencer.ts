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

  protected visitTypeDeclaration(
    name: TSESTree.Identifier,
    node: TSESTree.TSInterfaceDeclaration | TSESTree.TSTypeAliasDeclaration,
  ): void {
    this.referencer
      .currentScope()
      .defineIdentifier(name, new TypeDefinition(name, node));

    if (node.typeParameters) {
      // type parameters cannot be referenced from outside their current scope
      this.referencer.scopeManager.nestTypeScope(node);
    }

    this.visit(node.typeParameters);
  }

  static visit(referencer: Referencer, node: TSESTree.Node): void {
    const typeReferencer = new TypeReferencer(referencer);
    typeReferencer.visit(node);
  }

  protected TSTypeParameter(node: TSESTree.TSTypeParameter): void {
    this.referencer
      .currentScope()
      .defineIdentifier(node.name, new TypeDefinition(node.name, node));
  }
  protected TSTypeAliasDeclaration(
    node: TSESTree.TSTypeAliasDeclaration,
  ): void {
    this.visitTypeDeclaration(node.id, node);
    this.visit(node.typeAnnotation);
    this.referencer.close(node);
  }
  protected TSInterfaceDeclaration(
    node: TSESTree.TSInterfaceDeclaration,
  ): void {
    this.visitTypeDeclaration(node.id, node);
    node.extends?.forEach(this.visit, this);
    node.implements?.forEach(this.visit, this);
    this.visit(node.body);
    this.referencer.close(node);
  }

  protected Identifier(node: TSESTree.Identifier): void {
    this.referencer.currentScope().referenceType(node);
  }

  // a type query `typeof foo` is a special case that references a _non-type_ variable,
  protected TSTypeQuery(node: TSESTree.TSTypeQuery): void {
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

  protected TSQualifiedName(node: TSESTree.TSQualifiedName): void {
    this.visit(node.left);
    // we don't visit the right as it a name
  }
}

export { TypeReferencer };
