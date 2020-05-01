import { TSESTree } from '@typescript-eslint/experimental-utils';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';

class CatchClauseDefinition extends DefinitionBase {
  declare type: DefinitionType.CatchClause;

  constructor(name: TSESTree.BindingName, node: TSESTree.Node) {
    super(DefinitionType.CatchClause, name, node, null, null, null);
  }
}

export { CatchClauseDefinition };
