import {
  TSESTree,
  AST_NODE_TYPES,
} from '@typescript-eslint/experimental-utils';
import { ImportReferencer } from './ImportReferencer';
import { TypeReferencer } from './TypeReferencer';
import { assert } from '../assert';
import {
  CatchClauseDefinition,
  ClassNameDefinition,
  FunctionNameDefinition,
  ParameterDefinition,
  VariableDefinition,
} from '../definition';
import {
  PatternVisitor,
  PatternVisitorCallback,
  PatternVisitorOptions,
} from './PatternVisitor';
import { ReferenceFlag, ReferenceImplicitGlobal } from './Reference';
import { Scope } from '../scope';
import { ScopeManager } from '../ScopeManager';
import { Visitor, VisitorOptions } from './Visitor';

/**
 * Traverse identifier in pattern
 */
function traverseIdentifierInPattern(
  options: PatternVisitorOptions,
  rootPattern: TSESTree.Node,
  referencer: Referencer | null | undefined,
  callback: PatternVisitorCallback,
): void {
  // Call the callback at left hand identifier nodes, and Collect right hand nodes.
  const visitor = new PatternVisitor(options, rootPattern, callback);

  visitor.visit(rootPattern);

  // Process the right hand nodes recursively.
  if (referencer != null) {
    visitor.rightHandNodes.forEach(referencer.visit, referencer);
  }
}

type ReferencerOptions = VisitorOptions;
// Referencing variables and creating bindings.
class Referencer extends Visitor {
  private isInnerMethodDefinition: boolean;
  public readonly options: ReferencerOptions;
  public readonly scopeManager: ScopeManager;

  constructor(options: ReferencerOptions, scopeManager: ScopeManager) {
    super(null, options);
    this.options = options;
    this.scopeManager = scopeManager;
    this.isInnerMethodDefinition = false;
  }

  public currentScope(): Scope;
  public currentScope(throwOnNull: true): Scope | null;
  public currentScope(dontThrowOnNull?: true): Scope | null {
    if (!dontThrowOnNull) {
      assert(this.scopeManager.currentScope);
    }
    return this.scopeManager.currentScope;
  }

  public close(node: TSESTree.Node): void {
    while (this.currentScope(true) && node === this.currentScope().block) {
      this.scopeManager.currentScope = this.currentScope().close(
        this.scopeManager,
      );
    }
  }

  private pushInnerMethodDefinition(isInnerMethodDefinition: boolean): boolean {
    const previous = this.isInnerMethodDefinition;

    this.isInnerMethodDefinition = isInnerMethodDefinition;
    return previous;
  }

  private popInnerMethodDefinition(
    isInnerMethodDefinition: boolean | undefined,
  ): void {
    this.isInnerMethodDefinition = !!isInnerMethodDefinition;
  }

  private referencingDefaultValue(
    pattern: TSESTree.Identifier,
    assignments: (TSESTree.AssignmentExpression | TSESTree.AssignmentPattern)[],
    maybeImplicitGlobal: ReferenceImplicitGlobal | null,
    init: boolean,
  ): void {
    assignments.forEach(assignment => {
      this.currentScope().referenceValue(
        pattern,
        ReferenceFlag.WRITE,
        assignment.right,
        maybeImplicitGlobal,
        init,
      );
    });
  }

  ///////////////////
  // Visit helpers //
  ///////////////////

  protected visitClass(
    node: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
  ): void {
    if (node.type === AST_NODE_TYPES.ClassDeclaration && node.id) {
      this.currentScope().defineIdentifier(
        node.id,
        new ClassNameDefinition(node.id, node),
      );
    }

    this.visit(node.superClass);

    this.scopeManager.nestClassScope(node);

    if (node.id) {
      this.currentScope().defineIdentifier(
        node.id,
        new ClassNameDefinition(node.id, node),
      );
    }
    this.visit(node.body);

    this.close(node);
  }

  protected visitForIn(
    node: TSESTree.ForInStatement | TSESTree.ForOfStatement,
  ): void {
    if (
      node.left.type === AST_NODE_TYPES.VariableDeclaration &&
      node.left.kind !== 'var'
    ) {
      this.scopeManager.nestForScope(node);
    }

    if (node.left.type === AST_NODE_TYPES.VariableDeclaration) {
      this.visit(node.left);
      this.visitPattern(node.left.declarations[0].id, pattern => {
        this.currentScope().referenceValue(
          pattern,
          ReferenceFlag.WRITE,
          node.right,
          null,
          true,
        );
      });
    } else {
      this.visitPattern(
        node.left,
        { processRightHandNodes: true },
        (pattern, info) => {
          const maybeImplicitGlobal = !this.currentScope().isStrict
            ? {
                pattern,
                node,
              }
            : null;
          this.referencingDefaultValue(
            pattern,
            info.assignments,
            maybeImplicitGlobal,
            false,
          );
          this.currentScope().referenceValue(
            pattern,
            ReferenceFlag.WRITE,
            node.right,
            maybeImplicitGlobal,
            false,
          );
        },
      );
    }
    this.visit(node.right);
    this.visit(node.body);

    this.close(node);
  }

  protected visitFunction(
    node:
      | TSESTree.FunctionDeclaration
      | TSESTree.FunctionExpression
      | TSESTree.ArrowFunctionExpression,
  ): void {
    // FunctionDeclaration name is defined in upper scope
    // NOTE: Not referring variableScope. It is intended.
    // Since
    //  in ES5, FunctionDeclaration should be in FunctionBody.
    //  in ES6, FunctionDeclaration should be block scoped.

    if (node.type === AST_NODE_TYPES.FunctionDeclaration && node.id) {
      // id is defined in upper scope
      this.currentScope().defineIdentifier(
        node.id,
        new FunctionNameDefinition(node.id, node),
      );
    }

    // FunctionExpression with name creates its special scope;
    // FunctionExpressionNameScope.
    if (node.type === AST_NODE_TYPES.FunctionExpression && node.id) {
      this.scopeManager.nestFunctionExpressionNameScope(node);
    }

    // Consider this function is in the MethodDefinition.
    this.scopeManager.nestFunctionScope(node, this.isInnerMethodDefinition);

    const visitPatternCallback: PatternVisitorCallback = (pattern, info) => {
      this.currentScope().defineIdentifier(
        pattern,
        new ParameterDefinition(pattern, node, info.rest),
      );

      this.referencingDefaultValue(pattern, info.assignments, null, true);
    };

    // Process parameter declarations.
    for (let i = 0; i < node.params.length; ++i) {
      this.visitPattern(
        node.params[i],
        { processRightHandNodes: true },
        visitPatternCallback,
      );
    }

    // In TypeScript there are a number of function-like constructs which have no body,
    // so check it exists before traversing
    if (node.body) {
      // Skip BlockStatement to prevent creating BlockStatement scope.
      if (node.body.type === AST_NODE_TYPES.BlockStatement) {
        this.visitChildren(node.body);
      } else {
        this.visit(node.body);
      }
    }

    this.close(node);
  }

  protected visitPattern(
    node: TSESTree.Node,
    callback: PatternVisitorCallback,
  ): void;
  protected visitPattern(
    node: TSESTree.Node,
    options: PatternVisitorOptions,
    callback: PatternVisitorCallback,
  ): void;
  protected visitPattern(
    node: TSESTree.Node,
    optionsOrCallback: PatternVisitorCallback | PatternVisitorOptions,
    callback?: PatternVisitorCallback,
  ): void {
    let visitPatternOptions: PatternVisitorOptions;
    let visitPatternCallback: PatternVisitorCallback;

    if (typeof optionsOrCallback === 'function') {
      visitPatternCallback = optionsOrCallback;
      visitPatternOptions = { processRightHandNodes: false };
    } else {
      assert(callback);
      visitPatternCallback = callback;
      visitPatternOptions = optionsOrCallback;
    }

    traverseIdentifierInPattern(
      this.options,
      node,
      visitPatternOptions.processRightHandNodes ? this : null,
      visitPatternCallback,
    );
  }

  protected visitProperty(
    node:
      | TSESTree.MethodDefinition
      | TSESTree.TSAbstractMethodDefinition
      | TSESTree.Property,
  ): void {
    let previous;

    if (node.computed) {
      this.visit(node.key);
    }

    const isMethodDefinition = node.type === AST_NODE_TYPES.MethodDefinition;

    if (isMethodDefinition) {
      previous = this.pushInnerMethodDefinition(true);
    }
    this.visit(node.value);
    if (isMethodDefinition) {
      this.popInnerMethodDefinition(previous);
    }
  }

  /////////////////////
  // Visit selectors //
  /////////////////////

  protected ArrowFunctionExpression(
    node: TSESTree.ArrowFunctionExpression,
  ): void {
    this.visitFunction(node);
  }

  protected AssignmentExpression(node: TSESTree.AssignmentExpression): void {
    if (PatternVisitor.isPattern(node.left)) {
      if (node.operator === '=') {
        this.visitPattern(
          node.left,
          { processRightHandNodes: true },
          (pattern, info) => {
            const maybeImplicitGlobal = !this.currentScope().isStrict
              ? {
                  pattern,
                  node,
                }
              : null;
            this.referencingDefaultValue(
              pattern,
              info.assignments,
              maybeImplicitGlobal,
              false,
            );
            this.currentScope().referenceValue(
              pattern,
              ReferenceFlag.WRITE,
              node.right,
              maybeImplicitGlobal,
              false,
            );
          },
        );
      } else if (
        //
        node.left.type === AST_NODE_TYPES.Identifier
      ) {
        this.currentScope().referenceValue(
          node.left,
          ReferenceFlag.RW,
          node.right,
        );
      }
    } else {
      this.visit(node.left);
    }
    this.visit(node.right);
  }

  protected BlockStatement(node: TSESTree.BlockStatement): void {
    if (this.scopeManager.isES6()) {
      this.scopeManager.nestBlockScope(node);
    }

    this.visitChildren(node);

    this.close(node);
  }

  protected CallExpression(node: TSESTree.CallExpression): void {
    this.visitChildren(node);
  }

  protected CatchClause(node: TSESTree.CatchClause): void {
    this.scopeManager.nestCatchScope(node);

    if (node.param) {
      const param = node.param;
      this.visitPattern(
        param,
        { processRightHandNodes: true },
        (pattern, info) => {
          this.currentScope().defineIdentifier(
            pattern,
            new CatchClauseDefinition(param, node),
          );
          this.referencingDefaultValue(pattern, info.assignments, null, true);
        },
      );
    }
    this.visit(node.body);

    this.close(node);
  }

  protected ClassExpression(node: TSESTree.ClassExpression): void {
    this.visitClass(node);
  }

  protected ClassDeclaration(node: TSESTree.ClassDeclaration): void {
    this.visitClass(node);
  }

  protected ExportDefaultDeclaration(
    node: TSESTree.ExportDefaultDeclaration,
  ): void {
    this.visit(node.declaration);
  }

  protected ExportNamedDeclaration(
    node: TSESTree.ExportNamedDeclaration,
  ): void {
    if (node.declaration) {
      // export const x = 1;
      this.visit(node.declaration);
    } else {
      // export { x };
      this.visitChildren(node);
    }
  }

  protected ExportSpecifier(node: TSESTree.ExportSpecifier): void {
    this.visit(node.local);
  }

  protected ForInStatement(node: TSESTree.ForInStatement): void {
    this.visitForIn(node);
  }

  protected ForOfStatement(node: TSESTree.ForOfStatement): void {
    this.visitForIn(node);
  }

  protected ForStatement(node: TSESTree.ForStatement): void {
    // Create ForStatement declaration.
    // NOTE: In ES6, ForStatement dynamically generates per iteration environment. However, this is
    // a static analyzer, we only generate one scope for ForStatement.
    if (
      node.init &&
      node.init.type === AST_NODE_TYPES.VariableDeclaration &&
      node.init.kind !== 'var'
    ) {
      this.scopeManager.nestForScope(node);
    }

    this.visitChildren(node);

    this.close(node);
  }

  protected FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
    this.visitFunction(node);
  }

  protected FunctionExpression(node: TSESTree.FunctionExpression): void {
    this.visitFunction(node);
  }

  protected Identifier(node: TSESTree.Identifier): void {
    this.currentScope().referenceValue(node);
  }

  protected ImportDeclaration(node: TSESTree.ImportDeclaration): void {
    assert(
      this.scopeManager.isES6() && this.scopeManager.isModule(),
      'ImportDeclaration should appear when the mode is ES6 and in the module context.',
    );

    const importer = new ImportReferencer(node, this);
    importer.visit(node);
  }

  protected LabeledStatement(node: TSESTree.LabeledStatement): void {
    this.visit(node.body);
  }

  protected MemberExpression(node: TSESTree.MemberExpression): void {
    this.visit(node.object);
    if (node.computed) {
      this.visit(node.property);
    }
  }

  protected MethodDefinition(node: TSESTree.MethodDefinition): void {
    this.visitProperty(node);
  }

  protected Program(node: TSESTree.Program): void {
    this.scopeManager.nestGlobalScope(node);

    if (this.scopeManager.isGlobalReturn()) {
      // Force strictness of GlobalScope to false when using node.js scope.
      this.currentScope().isStrict = false;
      this.scopeManager.nestFunctionScope(node, false);
    }

    if (this.scopeManager.isES6() && this.scopeManager.isModule()) {
      this.scopeManager.nestModuleScope(node);
    }

    if (this.scopeManager.isStrict()) {
      this.currentScope().isStrict = true;
    }

    this.visitChildren(node);
    this.close(node);
  }

  protected Property(node: TSESTree.Property): void {
    this.visitProperty(node);
  }

  protected SwitchStatement(node: TSESTree.SwitchStatement): void {
    this.visit(node.discriminant);

    if (this.scopeManager.isES6()) {
      this.scopeManager.nestSwitchScope(node);
    }

    for (let i = 0, iz = node.cases.length; i < iz; ++i) {
      this.visit(node.cases[i]);
    }

    this.close(node);
  }

  protected UpdateExpression(node: TSESTree.UpdateExpression): void {
    if (PatternVisitor.isPattern(node.argument)) {
      this.visitPattern(node.argument, pattern => {
        this.currentScope().referenceValue(pattern, ReferenceFlag.RW, null);
      });
    } else {
      this.visitChildren(node);
    }
  }

  protected VariableDeclaration(node: TSESTree.VariableDeclaration): void {
    const variableTargetScope =
      node.kind === 'var'
        ? this.currentScope().variableScope
        : this.currentScope();

    for (let i = 0, iz = node.declarations.length; i < iz; ++i) {
      const decl = node.declarations[i];
      const init = decl.init;

      this.visitPattern(
        decl.id,
        { processRightHandNodes: true },
        (pattern, info) => {
          variableTargetScope.defineIdentifier(
            pattern,
            new VariableDefinition(pattern, decl, node),
          );

          this.referencingDefaultValue(pattern, info.assignments, null, true);
          if (init) {
            this.currentScope().referenceValue(
              pattern,
              ReferenceFlag.WRITE,
              init,
              null,
              true,
            );
          }
        },
      );

      if (decl.init) {
        this.visit(decl.init);
      }
    }
  }

  protected WithStatement(node: TSESTree.WithStatement): void {
    this.visit(node.object);

    // Then nest scope for WithStatement.
    this.scopeManager.nestWithScope(node);

    this.visit(node.body);

    this.close(node);
  }

  ///////////////////////////
  // TypeScript type nodes //
  ///////////////////////////

  protected visitTypeDeclaration(
    node:
      | TSESTree.TSTypeParameter
      | TSESTree.TSInterfaceDeclaration
      | TSESTree.TSTypeAliasDeclaration,
  ): void {
    const typeReferencer = new TypeReferencer(this);
    typeReferencer.visit(node);
  }

  protected TSTypeAliasDeclaration(
    node: TSESTree.TSTypeAliasDeclaration,
  ): void {
    this.visitTypeDeclaration(node);
  }
  protected TSInterfaceDeclaration(
    node: TSESTree.TSInterfaceDeclaration,
  ): void {
    this.visitTypeDeclaration(node);
  }
}

export { Referencer, ReferencerOptions };
