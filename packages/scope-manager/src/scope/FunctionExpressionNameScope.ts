import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Scope } from '.';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { Definition } from '../Definition';
import { VariableType } from '../VariableType';
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
      this.__define(
        block.id,
        new Definition(
          VariableType.FunctionName,
          block.id,
          block,
          null,
          null,
          null,
        ),
      );
    }
    this.functionExpressionScope = true;
  }
}

export { FunctionExpressionNameScope };
