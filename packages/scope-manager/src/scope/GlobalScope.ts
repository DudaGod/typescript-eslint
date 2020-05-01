import {
  TSESTree,
  AST_NODE_TYPES,
} from '@typescript-eslint/experimental-utils';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { Reference } from '../Reference';
import { ScopeManager } from '../ScopeManager';
import { Variable } from '../Variable';
import { ImplicitGlobalVariableDefinition } from '../definition/ImplicitGlobalVariableDefinition';

class GlobalScope extends ScopeBase<
  ScopeType.global,
  TSESTree.Program,
  /**
   * The global scope has no parent.
   */
  null
> {
  private implicit: {
    set: Map<string, Variable>;
    variables: Variable[];
    left: Reference[];
  };
  constructor(scopeManager: ScopeManager, block: GlobalScope['block']) {
    super(scopeManager, ScopeType.global, null, block, false);
    this.implicit = {
      set: new Map(),
      variables: [],
      /**
       * List of {@link Reference}s that are left to be resolved (i.e. which
       * need to be linked to the variable they refer to).
       */
      left: [],
    };
  }
  public close(scopeManager: ScopeManager): Scope | null {
    const implicit = [];
    for (let i = 0, iz = this.left!.length; i < iz; ++i) {
      const ref = this.left![i];
      if (ref.maybeImplicitGlobal && !this.set.has(ref.identifier.name)) {
        implicit.push(ref.maybeImplicitGlobal);
      }
    }
    // create an implicit global variable from assignment expression
    for (let i = 0, iz = implicit.length; i < iz; ++i) {
      const info = implicit[i];
      this.defineImplicit(
        info.pattern,
        new ImplicitGlobalVariableDefinition(info.pattern, info.node),
      );
    }
    this.implicit.left = this.left!;
    return super.close(scopeManager);
  }
  private defineImplicit(
    node: TSESTree.BindingName,
    def: ImplicitGlobalVariableDefinition,
  ): void {
    if (node && node.type === AST_NODE_TYPES.Identifier) {
      this.defineVariable(
        node.name,
        this.implicit.set,
        this.implicit.variables,
        node,
        def,
      );
    }
  }
}

export { GlobalScope };
