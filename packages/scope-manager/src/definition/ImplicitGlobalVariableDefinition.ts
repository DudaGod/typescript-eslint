import { TSESTree } from '@typescript-eslint/experimental-utils';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';

class ImplicitGlobalVariableDefinition extends DefinitionBase {
  declare type: DefinitionType.ImplicitGlobalVariable;

  constructor(name: TSESTree.BindingName, node: TSESTree.Node) {
    super(DefinitionType.ImplicitGlobalVariable, name, node, null, null, null);
  }
}

export { ImplicitGlobalVariableDefinition };
