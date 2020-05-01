import { TSESTree } from '@typescript-eslint/experimental-utils';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';

class VariableDefinition extends DefinitionBase {
  declare type: DefinitionType.Variable;

  constructor(
    name: TSESTree.Identifier,
    node: TSESTree.Node,
    decl: TSESTree.VariableDeclaration,
    index: number,
    kind: TSESTree.VariableDeclaration['kind'],
  ) {
    super(DefinitionType.Variable, name, node, decl, index, kind);
  }
}

export { VariableDefinition };
