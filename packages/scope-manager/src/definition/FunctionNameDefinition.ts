import { TSESTree } from '@typescript-eslint/experimental-utils';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';

class FunctionNameDefinition extends DefinitionBase {
  declare type: DefinitionType.FunctionName;

  constructor(name: TSESTree.Identifier, node: TSESTree.Node) {
    super(DefinitionType.FunctionName, name, node, null, null, null);
  }
}

export { FunctionNameDefinition };
