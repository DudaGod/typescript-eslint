import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Scope } from '.';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';

class CatchScope extends ScopeBase {
  declare type: ScopeType.catch;
  declare block: TSESTree.CatchClause;
  constructor(
    scopeManager: ScopeManager,
    upperScope: Scope | null,
    block: CatchScope['block'],
  ) {
    super(scopeManager, ScopeType.catch, upperScope, block, false);
  }
}

export { CatchScope };
