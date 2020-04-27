import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Scope } from '.';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';

class SwitchScope extends ScopeBase {
  declare type: ScopeType.switch;
  declare block: TSESTree.SwitchStatement;
  constructor(
    scopeManager: ScopeManager,
    upperScope: Scope | null,
    block: SwitchScope['block'],
  ) {
    super(scopeManager, ScopeType.switch, upperScope, block, false);
  }
}

export { SwitchScope };
