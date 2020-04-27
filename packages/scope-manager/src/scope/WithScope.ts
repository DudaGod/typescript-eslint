import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Scope } from '.';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';

class WithScope extends ScopeBase {
  declare type: ScopeType.with;
  declare block: TSESTree.WithStatement;
  constructor(
    scopeManager: ScopeManager,
    upperScope: Scope | null,
    block: WithScope['block'],
  ) {
    super(scopeManager, ScopeType.with, upperScope, block, false);
  }
  __close(scopeManager: ScopeManager): ReturnType<ScopeBase['__close']> {
    if (this.__shouldStaticallyClose(scopeManager)) {
      return super.__close(scopeManager);
    }
    for (let i = 0, iz = this.__left!.length; i < iz; ++i) {
      const ref = this.__left![i];
      ref.tainted = true;
      this.__delegateToUpperScope(ref);
    }
    this.__left = null;
    return this.upper;
  }
}

export { WithScope };
