import { TSESTree } from '@typescript-eslint/experimental-utils';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';

class ClassNameDefinition extends DefinitionBase {
  declare type: DefinitionType.ClassName;

  constructor(name: TSESTree.Identifier, node: TSESTree.Node) {
    super(DefinitionType.ClassName, name, node, null, null, null);
  }
}

export { ClassNameDefinition };
