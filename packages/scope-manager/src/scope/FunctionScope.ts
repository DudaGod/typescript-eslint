import assert from 'assert';
import {
  TSESTree,
  AST_NODE_TYPES,
} from '@typescript-eslint/experimental-utils';
import { Scope } from '.';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
import { Reference } from '../Reference';
import { Variable } from '../Variable';

class FunctionScope extends ScopeBase {
  declare type: ScopeType.function;
  declare block:
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.Program;
  constructor(
    scopeManager: ScopeManager,
    upperScope: Scope | null,
    block: FunctionScope['block'],
    isMethodDefinition: boolean,
  ) {
    super(
      scopeManager,
      ScopeType.function,
      upperScope,
      block,
      isMethodDefinition,
    );

    // section 9.2.13, FunctionDeclarationInstantiation.
    // NOTE Arrow functions never have an arguments objects.
    if (this.block.type !== AST_NODE_TYPES.ArrowFunctionExpression) {
      this.__defineArguments();
    }
  }

  isArgumentsMaterialized(): boolean {
    // TODO(Constellation)
    // We can more aggressive on this condition like this.
    //
    // function t() {
    //     // arguments of t is always hidden.
    //     function arguments() {
    //     }
    // }
    if (this.block.type === AST_NODE_TYPES.ArrowFunctionExpression) {
      return false;
    }

    if (!this.isStatic()) {
      return true;
    }

    const variable = this.set.get('arguments');

    assert(variable, 'Always have arguments variable.');
    return variable!.tainted || variable!.references.length !== 0;
  }

  isThisMaterialized(): boolean {
    if (!this.isStatic()) {
      return true;
    }
    return this.thisFound;
  }

  __defineArguments(): void {
    this.__defineGeneric('arguments', this.set, this.variables, null, null);
    this.taints.set('arguments', true);
  }

  // References in default parameters isn't resolved to variables which are in their function body.
  //     const x = 1
  //     function f(a = x) { // This `x` is resolved to the `x` in the outer scope.
  //         const x = 2
  //         console.log(a)
  //     }
  __isValidResolution(ref: Reference, variable: Variable): boolean {
    // If `options.gloablReturn` is true, `this.block` becomes a Program node.
    if (this.block.type === AST_NODE_TYPES.Program) {
      return true;
    }

    const bodyStart = this.block.body?.range[0] ?? -1;

    // It's invalid resolution in the following case:
    return !(
      (
        variable.scope === this &&
        ref.identifier.range[0] < bodyStart && // the reference is in the parameter part.
        variable.defs.every(d => d.name.range[0] >= bodyStart)
      ) // the variable is in the body.
    );
  }
}

export { FunctionScope };
