import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Scope } from '.';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';

class ModuleScope extends ScopeBase {
  declare type: ScopeType.module;
  declare block: TSESTree.Program;
  constructor(
    scopeManager: ScopeManager,
    upperScope: Scope | null,
    block: ModuleScope['block'],
  ) {
    super(scopeManager, ScopeType.module, upperScope, block, false);
  }
}

export { ModuleScope };
