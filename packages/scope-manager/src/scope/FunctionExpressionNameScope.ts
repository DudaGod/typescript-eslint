import { TSESTree } from '@typescript-eslint/experimental-utils';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { Scope } from './Scope';
import { FunctionNameDefinition } from '../definition';
import { ScopeManager } from '../ScopeManager';

class FunctionExpressionNameScope extends ScopeBase {
  public readonly functionExpressionScope: true;
  declare type: ScopeType.functionExpressionName;
  declare block: TSESTree.FunctionExpression;
  constructor(
    scopeManager: ScopeManager,
    upperScope: Scope | null,
    block: FunctionExpressionNameScope['block'],
  ) {
    super(
      scopeManager,
      ScopeType.functionExpressionName,
      upperScope,
      block,
      false,
    );
    if (block.id) {
      this.__define(block.id, new FunctionNameDefinition(block.id, block));
    }
    this.functionExpressionScope = true;
  }
}

export { FunctionExpressionNameScope };
