import { TSESTree } from '@typescript-eslint/experimental-utils';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';

class ImportBindingDefinition extends DefinitionBase {
  declare type: DefinitionType.ImportBinding;

  constructor(
    name: TSESTree.Identifier,
    node: TSESTree.Node,
    decl: TSESTree.ImportDeclaration,
  ) {
    super(DefinitionType.ImportBinding, name, node, decl, null, null);
  }
}

export { ImportBindingDefinition };
