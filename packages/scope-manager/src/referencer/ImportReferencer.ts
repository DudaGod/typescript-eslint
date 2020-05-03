import { TSESTree } from '@typescript-eslint/experimental-utils';
import { ImportBindingDefinition } from '../definition';
import { Referencer } from './Referencer';
import { Visitor } from './Visitor';

class ImportReferencer extends Visitor {
  public readonly declaration: TSESTree.ImportDeclaration;
  public readonly referencer: Referencer;

  constructor(declaration: TSESTree.ImportDeclaration, referencer: Referencer) {
    super(null, referencer.options);
    this.declaration = declaration;
    this.referencer = referencer;
  }

  visitImport(
    id: TSESTree.Identifier,
    specifier:
      | TSESTree.ImportDefaultSpecifier
      | TSESTree.ImportNamespaceSpecifier
      | TSESTree.ImportSpecifier,
  ): void {
    this.referencer
      .currentScope()
      .defineIdentifier(
        id,
        new ImportBindingDefinition(id, specifier, this.declaration),
      );
  }

  ImportNamespaceSpecifier(node: TSESTree.ImportNamespaceSpecifier): void {
    const local = node.local;
    this.visitImport(local, node);
  }

  ImportDefaultSpecifier(node: TSESTree.ImportDefaultSpecifier): void {
    const local = node.local;
    this.visitImport(local, node);
  }

  ImportSpecifier(node: TSESTree.ImportSpecifier): void {
    const local = node.local;
    this.visitImport(local, node);
  }
}

export { ImportReferencer };
