import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Scope } from '.';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';

class BlockScope extends ScopeBase {
  declare type: ScopeType.block;
  declare block: TSESTree.BlockStatement;
  constructor(
    scopeManager: ScopeManager,
    upperScope: Scope | null,
    block: BlockScope['block'],
  ) {
    super(scopeManager, ScopeType.block, upperScope, block, false);
  }
}

export { BlockScope };
