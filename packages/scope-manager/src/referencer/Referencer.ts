import {
  TSESTree,
  AST_NODE_TYPES,
} from '@typescript-eslint/experimental-utils';
import { ImportVisitor } from './ImportVisitor';
import {
  PatternVisitor,
  PatternVisitorCallback,
  PatternVisitorOptions,
} from './PatternVisitor';
import { ReferenceFlag, ReferenceImplicitGlobal } from './Reference';
import { TypeVisitor } from './TypeVisitor';
import { Visitor, VisitorOptions } from './Visitor';
import { assert } from '../assert';
import {
  CatchClauseDefinition,
  ClassNameDefinition,
  FunctionNameDefinition,
  ImportBindingDefinition,
  ParameterDefinition,
  VariableDefinition,
} from '../definition';
import { Scope } from '../scope';
import { ScopeManager } from '../ScopeManager';

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
        { processRightHandNodes: true },
      );
    }
    this.visit(node.right);
    this.visit(node.body);

    this.close(node);
  }

  protected visitFunction(
    node:
      | TSESTree.ArrowFunctionExpression
      | TSESTree.FunctionDeclaration
      | TSESTree.FunctionExpression
      | TSESTree.TSDeclareFunction
      | TSESTree.TSEmptyBodyFunctionExpression,
  ): void {
    // FunctionDeclaration name is defined in upper scope
    // NOTE: Not referring variableScope. It is intended.
    // Since
    //  in ES5, FunctionDeclaration should be in FunctionBody.
    //  in ES6, FunctionDeclaration should be block scoped.

    if (node.type === AST_NODE_TYPES.FunctionExpression) {
      if (node.id) {
        // FunctionExpression with name creates its special scope;
        // FunctionExpressionNameScope.
        this.scopeManager.nestFunctionExpressionNameScope(node);
      }
    } else if (node.id) {
      // id is defined in upper scope
      this.currentScope().defineIdentifier(
        node.id,
        new FunctionNameDefinition(node.id, node),
      );
    }

    // Consider this function is in the MethodDefinition.
    this.scopeManager.nestFunctionScope(node, this.isInnerMethodDefinition);

    // Process parameter declarations.
    for (let i = 0; i < node.params.length; ++i) {
      this.visitPattern(
        node.params[i],
        (pattern, info) => {
          this.currentScope().defineIdentifier(
            pattern,
            new ParameterDefinition(pattern, node, info.rest),
          );

          this.referencingDefaultValue(pattern, info.assignments, null, true);
        },
        { processRightHandNodes: true },
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
    options: PatternVisitorOptions = { processRightHandNodes: false },
  ): void {
    // Call the callback at left hand identifier nodes, and Collect right hand nodes.
    const visitor = new PatternVisitor(this.options, node, callback);

    visitor.visit(node);

    // Process the right hand nodes recursively.
    if (options.processRightHandNodes) {
      visitor.rightHandNodes.forEach(this.visit, this);
    }
  }

  protected visitProperty(
    node:
      | TSESTree.ClassProperty
      | TSESTree.MethodDefinition
      | TSESTree.Property
      | TSESTree.TSAbstractClassProperty
      | TSESTree.TSAbstractMethodDefinition,
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

  protected visitType(node: TSESTree.Node | null | undefined): void {
    if (!node) {
      return;
    }
    TypeVisitor.visit(this, node);
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
          { processRightHandNodes: true },
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

  protected BreakStatement(): void {
    // don't reference the break statement's label
  }

  protected CallExpression(
    node: TSESTree.CallExpression | TSESTree.OptionalCallExpression,
  ): void {
    this.visitChildren(node);
  }

  protected CatchClause(node: TSESTree.CatchClause): void {
    this.scopeManager.nestCatchScope(node);

    if (node.param) {
      const param = node.param;
      this.visitPattern(
        param,
        (pattern, info) => {
          this.currentScope().defineIdentifier(
            pattern,
            new CatchClauseDefinition(param, node),
          );
          this.referencingDefaultValue(pattern, info.assignments, null, true);
        },
        { processRightHandNodes: true },
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

  protected ClassProperty(node: TSESTree.ClassProperty): void {
    this.visitProperty(node);
  }

  protected ContinueStatement(): void {
    // don't reference the continue statement's label
  }

  protected ExportAllDeclaration(): void {
    // this defines no local variables
  }

  protected ExportDefaultDeclaration(
    node: TSESTree.ExportDefaultDeclaration,
  ): void {
    this.visit(node.declaration);
  }

  protected ExportNamedDeclaration(
    node: TSESTree.ExportNamedDeclaration,
  ): void {
    if (node.source) {
      // export ... from 'foo';
      // these are external identifiers so there shouldn't be references or defs
      return;
    }

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

    ImportVisitor.visit(this, node);
  }

  protected LabeledStatement(node: TSESTree.LabeledStatement): void {
    this.visit(node.body);
  }

  protected MemberExpression(
    node: TSESTree.MemberExpression | TSESTree.OptionalMemberExpression,
  ): void {
    this.visit(node.object);
    if (node.computed) {
      this.visit(node.property);
    }
  }

  protected MetaProperty(): void {
    // meta properties all builtin globals
  }

  protected MethodDefinition(node: TSESTree.MethodDefinition): void {
    this.visitProperty(node);
  }

  protected OptionalCallExpression(
    node: TSESTree.OptionalCallExpression,
  ): void {
    this.CallExpression(node);
  }

  protected OptionalMemberExpression(
    node: TSESTree.OptionalMemberExpression,
  ): void {
    this.MemberExpression(node);
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

    for (let i = 0; i < node.cases.length; ++i) {
      this.visit(node.cases[i]);
    }

    this.close(node);
  }

  protected TSAbstractClassProperty(
    node: TSESTree.TSAbstractClassProperty,
  ): void {
    this.visitProperty(node);
  }

  protected TSAbstractMethodDefinition(
    node: TSESTree.TSAbstractMethodDefinition,
  ): void {
    this.visitProperty(node);
  }

  protected TSAsExpression(node: TSESTree.TSAsExpression): void {
    this.visitType(node);
  }

  protected TSDeclareFunction(node: TSESTree.TSDeclareFunction): void {
    this.visitFunction(node);
  }

  protected TSImportEqualsDeclaration(
    node: TSESTree.TSImportEqualsDeclaration,
  ): void {
    this.currentScope().defineIdentifier(
      node.id,
      new ImportBindingDefinition(node.id, node, node),
    );

    if (node.moduleReference.type === AST_NODE_TYPES.TSQualifiedName) {
      this.visit(node.moduleReference.left);
    } else {
      this.visit(node.moduleReference);
    }
  }

  protected TSEmptyBodyFunctionExpression(
    node: TSESTree.TSEmptyBodyFunctionExpression,
  ): void {
    this.visitFunction(node);
  }

  protected TSInterfaceDeclaration(
    node: TSESTree.TSInterfaceDeclaration,
  ): void {
    this.visitType(node);
  }

  protected TSTypeAliasDeclaration(
    node: TSESTree.TSTypeAliasDeclaration,
  ): void {
    this.visitType(node);
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

    for (let i = 0; i < node.declarations.length; ++i) {
      const decl = node.declarations[i];
      const init = decl.init;

      this.visitPattern(
        decl.id,
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
        { processRightHandNodes: true },
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
}

export { Referencer, ReferencerOptions };
