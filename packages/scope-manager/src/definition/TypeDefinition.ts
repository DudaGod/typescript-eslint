import { TSESTree } from '@typescript-eslint/experimental-utils';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';

class TypeDefinition extends DefinitionBase<
  DefinitionType.Type,
  TSESTree.Node, // TODO
  null
> {
  constructor(name: TSESTree.Identifier, node: TSESTree.Node) {
    super(DefinitionType.Type, name, node, null);
  }

  public readonly isTypeDefinition = true;
  public readonly isVariableDefinition = false;
}

export { TypeDefinition };
