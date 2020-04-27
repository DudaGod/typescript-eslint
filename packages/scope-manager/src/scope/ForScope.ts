import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Scope } from '.';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';

class ForScope extends ScopeBase {
  declare type: ScopeType.class;
  declare block:
    | TSESTree.ForInStatement
    | TSESTree.ForOfStatement
    | TSESTree.ForStatement;
  constructor(
    scopeManager: ScopeManager,
    upperScope: Scope | null,
    block: ForScope['block'],
  ) {
    super(scopeManager, ScopeType.for, upperScope, block, false);
  }
}

export { ForScope };
