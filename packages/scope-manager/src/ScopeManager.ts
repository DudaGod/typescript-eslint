import assert from 'assert';
import { Scope } from './scope';
import { ClassScope } from './scope/ClassScope';
import { ForScope } from './scope/ForScope';
import { FunctionScope } from './scope/FunctionScope';
import { SwitchScope } from './scope/SwitchScope';
import { BlockScope } from './scope/BlockScope';
import { WithScope } from './scope/WithScope';
import { CatchScope } from './scope/CatchScope';
import { FunctionExpressionNameScope } from './scope/FunctionExpressionNameScope';
import { ModuleScope } from './scope/ModuleScope';
import { GlobalScope } from './scope/GlobalScope';
import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Variable } from './variable';

interface ScopeManagerOptions {
  optimistic?: boolean;
  ignoreEval?: boolean;
  nodejsScope?: boolean;
  sourceType?: 'module' | 'script';
  impliedStrict?: boolean;
  ecmaVersion?: number;
}

class ScopeManager {
  public scopes: Scope[];
  public globalScope: GlobalScope | null;
  private __options: ScopeManagerOptions;
  public __currentScope: Scope | null;
  public __nodeToScope: WeakMap<TSESTree.Node, Scope[]>;
  public __declaredVariables: WeakMap<TSESTree.Node, Variable[]>;

  constructor(options: ScopeManagerOptions) {
    this.scopes = [];
    this.globalScope = null;
    this.__nodeToScope = new WeakMap();
    this.__currentScope = null;
    this.__options = options;
    this.__declaredVariables = new WeakMap();
  }

  __isOptimistic(): boolean {
    return this.__options.optimistic === true;
  }

  __ignoreEval(): boolean {
    return this.__options.ignoreEval === true;
  }

  __isNodejsScope(): boolean {
    return this.__options.nodejsScope === true;
  }

  isModule(): boolean {
    return this.__options.sourceType === 'module';
  }

  isImpliedStrict(): boolean {
    return this.__options.impliedStrict === true;
  }

  isStrictModeSupported(): boolean {
    return (
      this.__options.ecmaVersion != null && this.__options.ecmaVersion >= 5
    );
  }

  /**
   * Returns appropriate scope for this node.
   */
  __get(node: TSESTree.Node): Scope[] | undefined {
    return this.__nodeToScope.get(node);
  }

  /**
   * Get variables that are declared by the node.
   *
   * "are declared by the node" means the node is same as `Variable.defs[].node` or `Variable.defs[].parent`.
   * If the node declares nothing, this method returns an empty array.
   */
  getDeclaredVariables(node: TSESTree.Node): Variable[] {
    return this.__declaredVariables.get(node) ?? [];
  }

  /**
   * acquire scope from node.
   * @param node - node for the acquired scope.
   * @param inner - look up the most inner scope, default value is false.
   */
  acquire(node: TSESTree.Node, inner: boolean): Scope | null {
    function predicate(testScope: Scope): boolean {
      if (testScope.type === 'function' && testScope.functionExpressionScope) {
        return false;
      }
      return true;
    }

    const scopes = this.__get(node);

    if (!scopes || scopes.length === 0) {
      return null;
    }

    // Heuristic selection from all scopes.
    // If you would like to get all scopes, please use ScopeManager#acquireAll.
    if (scopes.length === 1) {
      return scopes[0];
    }

    if (inner) {
      for (let i = scopes.length - 1; i >= 0; --i) {
        const scope = scopes[i];

        if (predicate(scope)) {
          return scope;
        }
      }
    } else {
      for (let i = 0, iz = scopes.length; i < iz; ++i) {
        const scope = scopes[i];

        if (predicate(scope)) {
          return scope;
        }
      }
    }

    return null;
  }

  /**
   * acquire all scopes from node.
   * @param node - node for the acquired scope.
   */
  acquireAll(node: TSESTree.Node): Scope[] | undefined {
    return this.__get(node);
  }

  /**
   * release the node.
   * @param node - releasing node.
   * @param inner - look up the most inner scope, default value is false.
   */
  release(node: TSESTree.Node, inner: boolean): Scope | null {
    const scopes = this.__get(node);

    if (scopes?.length) {
      const scope = scopes[0].upper;

      if (!scope) {
        return null;
      }
      return this.acquire(scope.block, inner);
    }
    return null;
  }

  attach(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
  detach(): void {} // eslint-disable-line @typescript-eslint/no-empty-function

  __nestScope(scope: Scope): Scope {
    if (scope instanceof GlobalScope) {
      assert(this.__currentScope === null);
      this.globalScope = scope;
    }
    this.__currentScope = scope;
    return scope;
  }

  __nestGlobalScope(node: GlobalScope['block']): Scope {
    return this.__nestScope(new GlobalScope(this, node));
  }

  __nestBlockScope(node: BlockScope['block']): Scope {
    return this.__nestScope(new BlockScope(this, this.__currentScope, node));
  }

  __nestFunctionScope(
    node: FunctionScope['block'],
    isMethodDefinition: boolean,
  ): Scope {
    return this.__nestScope(
      new FunctionScope(this, this.__currentScope, node, isMethodDefinition),
    );
  }

  __nestForScope(node: ForScope['block']): Scope {
    return this.__nestScope(new ForScope(this, this.__currentScope, node));
  }

  __nestCatchScope(node: CatchScope['block']): Scope {
    return this.__nestScope(new CatchScope(this, this.__currentScope, node));
  }

  __nestWithScope(node: WithScope['block']): Scope {
    return this.__nestScope(new WithScope(this, this.__currentScope, node));
  }

  __nestClassScope(node: ClassScope['block']): Scope {
    return this.__nestScope(new ClassScope(this, this.__currentScope, node));
  }

  __nestSwitchScope(node: SwitchScope['block']): Scope {
    return this.__nestScope(new SwitchScope(this, this.__currentScope, node));
  }

  __nestModuleScope(node: ModuleScope['block']): Scope {
    return this.__nestScope(new ModuleScope(this, this.__currentScope, node));
  }

  __nestFunctionExpressionNameScope(
    node: FunctionExpressionNameScope['block'],
  ): Scope {
    return this.__nestScope(
      new FunctionExpressionNameScope(this, this.__currentScope, node),
    );
  }

  __isES6(): boolean {
    return (
      this.__options.ecmaVersion != null && this.__options.ecmaVersion >= 6
    );
  }
}

export { ScopeManager };
