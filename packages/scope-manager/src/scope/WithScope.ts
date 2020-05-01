import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';

class WithScope extends ScopeBase<
  ScopeType.with,
  TSESTree.WithStatement,
  Scope
> {
  constructor(
    scopeManager: ScopeManager,
    upperScope: WithScope['upper'],
    block: WithScope['block'],
  ) {
    super(scopeManager, ScopeType.with, upperScope, block, false);
  }
  close(scopeManager: ScopeManager): Scope | null {
    if (this.shouldStaticallyClose()) {
      return super.close(scopeManager);
    }
    for (let i = 0, iz = this.left!.length; i < iz; ++i) {
      const ref = this.left![i];
      this.delegateToUpperScope(ref);
    }
    this.left = null;
    return this.upper;
  }
}

export { WithScope };
