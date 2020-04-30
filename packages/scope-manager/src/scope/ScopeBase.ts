import assert from 'assert';
import {
  TSESTree,
  AST_NODE_TYPES,
} from '@typescript-eslint/experimental-utils';
import { FunctionScope } from './FunctionScope';
import { GlobalScope } from './GlobalScope';
import { ScopeType } from './ScopeType';
import { Definition } from '../Definition';
import {
  Reference,
  ReferenceFlag,
  ReferenceImplicitGlobal,
} from '../Reference';
import { ScopeManager } from '../ScopeManager';
import { BlockNode, Scopes } from './Scopes';
import { Variable } from '../Variable';
import { VariableType } from '../VariableType';
import { ModuleScope } from './ModuleScope';

/**
 * Test if scope is strict
 */
function isStrictScope(
  scope: ScopeBase,
  block: BlockNode,
  isMethodDefinition: boolean,
): boolean {
  let body: TSESTree.BlockStatement | TSESTree.Program | null | undefined;

  // When upper scope is exists and strict, inner scope is also strict.
  if (scope.upper && scope.upper.isStrict) {
    return true;
  }

  if (isMethodDefinition) {
    return true;
  }

  if (scope.type === ScopeType.class || scope.type === ScopeType.module) {
    return true;
  }

  if (scope.type === ScopeType.block || scope.type === ScopeType.switch) {
    return false;
  }

  if (scope.type === ScopeType.function) {
    const functionBody = block as FunctionScope['block'];
    switch (functionBody.type) {
      case AST_NODE_TYPES.ArrowFunctionExpression:
        if (functionBody.body.type !== AST_NODE_TYPES.BlockStatement) {
          return false;
        }
        body = functionBody.body;
        break;

      case AST_NODE_TYPES.Program:
        body = functionBody;
        break;

      default:
        body = functionBody.body;
    }

    if (!body) {
      return false;
    }
  } else if (scope.type === ScopeType.global) {
    body = block as GlobalScope['block'];
  } else {
    return false;
  }

  // Search 'use strict' directive.
  for (let i = 0, iz = body.body.length; i < iz; ++i) {
    const stmt = body.body[i];

    if (stmt.type !== AST_NODE_TYPES.ExpressionStatement) {
      break;
    }
    const expr = stmt.expression;

    if (
      expr.type !== AST_NODE_TYPES.Literal ||
      typeof expr.value !== 'string'
    ) {
      break;
    }
    if (expr.raw !== null && expr.raw !== undefined) {
      if (expr.raw === '"use strict"' || expr.raw === "'use strict'") {
        return true;
      }
    } else {
      if (expr.value === 'use strict') {
        return true;
      }
    }
  }
  return false;
}

/**
 * Register scope
 */
function registerScope(scopeManager: ScopeManager, scope: ScopeBase): void {
  const scopeWillBeValidChildClassTrustMe = scope as Scopes;
  scopeManager.scopes.push(scopeWillBeValidChildClassTrustMe);

  const scopes = scopeManager.__nodeToScope.get(scope.block);

  if (scopes) {
    scopes.push(scopeWillBeValidChildClassTrustMe);
  } else {
    scopeManager.__nodeToScope.set(scope.block, [
      scopeWillBeValidChildClassTrustMe,
    ]);
  }
}

/**
 * Should be statically
 */
function shouldBeStatically(def: Definition): boolean {
  return (
    def.type === VariableType.ClassName ||
    (def.type === VariableType.Variable &&
      def.parent?.type === AST_NODE_TYPES.VariableDeclaration &&
      def.parent.kind !== 'var')
  );
}

class ScopeBase {
  /**
   * A reference to the scope-defining syntax node.
   */
  public readonly block: BlockNode;
  /**
   * List of nested {@link Scope}s.
   */
  public readonly childScopes: ScopeBase[] = [];
  /**
   * Generally, through the lexical scoping of JS you can always know
   * which variable an identifier in the source code refers to. There are
   * a few exceptions to this rule. With 'global' and 'with' scopes you
   * can only decide at runtime which variable a reference refers to.
   * All those scopes are considered 'dynamic'.
   */
  public dynamic: boolean;
  /**
   * Whether this scope is created by a FunctionExpression.
   */
  public readonly functionExpressionScope: boolean = false;
  /**
   * Whether 'use strict' is in effect in this scope.
   */
  public isStrict: boolean;
  /**
   * Any variable {@link Reference|reference} found in this scope. This
   * includes occurrences of local variables as well as variables from
   * parent scopes (including the global scope). For local variables
   * this also includes defining occurrences (like in a 'var' statement).
   * In a 'function' scope this does not include the occurrences of the
   * formal parameter in the parameter list.
   */
  public readonly references: Reference[] = [];
  /**
   * The scoped {@link Variable}s of this scope, as `{ Variable.name: Variable }`.
   */
  public readonly set = new Map<string, Variable>();
  /**
   * The tainted variables of this scope, as `{ Variable.name: boolean }`.
   */
  public readonly taints = new Map<string, boolean>();
  public thisFound = false;
  /**
   * The {@link Reference|references} that are not resolved with this scope.
   */
  public readonly through: Reference[] = [];
  /**
   * The type of scope
   */
  public readonly type: ScopeType;
  /**
   * Reference to the parent {@link Scope}.
   */
  public readonly upper: Scopes | null;
  /**
   * The scoped {@link Variable}s of this scope. In the case of a
   * 'function' scope this includes the automatic argument *arguments* as
   * its first element, as well as all further formal arguments.
   */
  public readonly variables: Variable[] = [];
  /**
   * For 'global' and 'function' scopes, this is a self-reference. For
   * other scope types this is the *variableScope* value of the
   * parent scope.
   */
  public readonly variableScope: GlobalScope | FunctionScope | ModuleScope;

  public __left: Reference[] | null = [];
  private readonly __declaredVariables: WeakMap<TSESTree.Node, Variable[]>;

  constructor(
    scopeManager: ScopeManager,
    type: ScopeType,
    upperScope: Scopes | null,
    block: BlockNode,
    isMethodDefinition: boolean,
  ) {
    this.type = type;
    this.dynamic =
      this.type === ScopeType.global || this.type === ScopeType.with;
    this.block = block;
    this.variableScope =
      this.type === 'global' ||
      this.type === 'function' ||
      this.type === 'module'
        ? (this as ScopeBase['variableScope'])
        : upperScope!.variableScope;
    this.upper = upperScope;

    /**
     * Whether 'use strict' is in effect in this scope.
     * @member {boolean} Scope#isStrict
     */
    this.isStrict = isStrictScope(this, block, isMethodDefinition);

    if (this.upper) {
      this.upper.childScopes.push(this);
    }

    this.__declaredVariables = scopeManager.__declaredVariables;

    registerScope(scopeManager, this);
  }

  __shouldStaticallyClose(): boolean {
    return !this.dynamic;
  }

  __shouldStaticallyCloseForGlobal(ref: Reference): boolean {
    // On global scope, let/const/class declarations should be resolved statically.
    const name = ref.identifier.name;

    if (!this.set.has(name)) {
      return false;
    }

    const variable = this.set.get(name);
    const defs = variable?.defs;

    return defs != null && defs.length > 0 && defs.every(shouldBeStatically);
  }

  __staticCloseRef = (ref: Reference): void => {
    if (!this.__resolve(ref)) {
      this.__delegateToUpperScope(ref);
    }
  };

  __dynamicCloseRef = (ref: Reference): void => {
    // notify all names are through to global
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: ScopeBase | null = this;

    do {
      current.through.push(ref);
      current = current.upper;
    } while (current);
  };

  __globalCloseRef = (ref: Reference): void => {
    // let/const/class declarations should be resolved statically.
    // others should be resolved dynamically.
    if (this.__shouldStaticallyCloseForGlobal(ref)) {
      this.__staticCloseRef(ref);
    } else {
      this.__dynamicCloseRef(ref);
    }
  };

  __close(_scopeManager: ScopeManager): Scopes | null {
    let closeRef;

    if (this.__shouldStaticallyClose()) {
      closeRef = this.__staticCloseRef;
    } else if (this.type !== 'global') {
      closeRef = this.__dynamicCloseRef;
    } else {
      closeRef = this.__globalCloseRef;
    }

    // Try Resolving all references in this scope.
    for (let i = 0, iz = this.__left!.length; i < iz; ++i) {
      const ref = this.__left![i];

      closeRef(ref);
    }
    this.__left = null;

    return this.upper;
  }

  /**
   * To override by function scopes.
   * References in default parameters isn't resolved to variables which are in their function body.
   */
  __isValidResolution(_ref: Reference, _variable: Variable): boolean {
    return true;
  }

  __resolve(ref: Reference): boolean {
    const name = ref.identifier.name;

    if (!this.set.has(name)) {
      return false;
    }
    const variable = this.set.get(name);

    if (!variable || !this.__isValidResolution(ref, variable)) {
      return false;
    }
    variable.references.push(ref);
    variable.stack =
      variable.stack && ref.from.variableScope === this.variableScope;
    if (ref.tainted) {
      variable.tainted = true;
      this.taints.set(variable.name, true);
    }
    ref.resolved = variable;

    return true;
  }

  __delegateToUpperScope(ref: Reference): void {
    if (this.upper && this.upper.__left) {
      this.upper.__left.push(ref);
    }
    this.through.push(ref);
  }

  __addDeclaredVariablesOfNode(
    variable: Variable,
    node: TSESTree.Node | null | undefined,
  ): void {
    if (node == null) {
      return;
    }

    let variables = this.__declaredVariables.get(node);

    if (variables == null) {
      variables = [];
      this.__declaredVariables.set(node, variables);
    }
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }

  __defineGeneric(
    name: string,
    set: Map<string, Variable>,
    variables: Variable[],
    node: TSESTree.Identifier | null,
    def: Definition | null,
  ): void {
    let variable;

    variable = set.get(name);
    if (!variable) {
      variable = new Variable(name, this as Scopes);
      set.set(name, variable);
      variables.push(variable);
    }

    if (def) {
      variable.defs.push(def);
      this.__addDeclaredVariablesOfNode(variable, def.node);
      this.__addDeclaredVariablesOfNode(variable, def.parent);
    }
    if (node) {
      variable.identifiers.push(node);
    }
  }

  __define(node: TSESTree.Node | null, def: Definition): void {
    if (node && node.type === AST_NODE_TYPES.Identifier) {
      this.__defineGeneric(node.name, this.set, this.variables, node, def);
    }
  }

  __referencing(
    node: TSESTree.Node,
    assign?: ReferenceFlag,
    writeExpr?: TSESTree.Node | null,
    maybeImplicitGlobal?: ReferenceImplicitGlobal | null,
    partial?: boolean,
    init?: boolean,
  ): void {
    // because Array element may be null
    if (!node || node.type !== AST_NODE_TYPES.Identifier) {
      return;
    }

    // Specially handle like `this`.
    if (node.name === 'super') {
      return;
    }

    const ref = new Reference(
      node,
      this as Scopes,
      assign ?? ReferenceFlag.READ,
      writeExpr,
      maybeImplicitGlobal,
      !!partial,
      !!init,
    );

    this.references.push(ref);
    this.__left?.push(ref);
  }

  __detectThis(): void {
    this.thisFound = true;
  }

  __isClosed(): boolean {
    return this.__left === null;
  }

  /**
   * returns resolved {@link Reference}
   */
  resolve(ident: TSESTree.Identifier): Reference | null {
    let ref, i, iz;

    assert(this.__isClosed(), 'Scope should be closed.');
    assert(
      ident.type === AST_NODE_TYPES.Identifier,
      'Target should be identifier.',
    );
    for (i = 0, iz = this.references.length; i < iz; ++i) {
      ref = this.references[i];
      if (ref.identifier === ident) {
        return ref;
      }
    }
    return null;
  }

  /**
   * returns this scope is static
   */
  isStatic(): boolean {
    return !this.dynamic;
  }

  /**
   * returns this scope has materialized arguments
   */
  isArgumentsMaterialized(): boolean {
    return true;
  }

  /**
   * returns this scope has materialized `this` reference
   */
  isThisMaterialized(): boolean {
    return true;
  }

  isUsedName(name: string): boolean {
    if (this.set.has(name)) {
      return true;
    }
    for (let i = 0, iz = this.through.length; i < iz; ++i) {
      if (this.through[i].identifier.name === name) {
        return true;
      }
    }
    return false;
  }
}

export { ScopeBase };
