import {
  TSESTree,
  AST_NODE_TYPES,
} from '@typescript-eslint/experimental-utils';
import { Definition, ParameterDefinition } from '../../../src/definition';
import {
  BlockScope,
  CatchScope,
  ClassScope,
  ForScope,
  FunctionExpressionNameScope,
  FunctionScope,
  GlobalScope,
  ModuleScope,
  Scope,
  ScopeType,
  SwitchScope,
  WithScope,
} from '../../../src/scope';

function expectToBeBlockScope(scope: Scope): asserts scope is BlockScope {
  expect(scope.type).toBe(ScopeType.block);
}
function expectToBeCatchScope(scope: Scope): asserts scope is CatchScope {
  expect(scope.type).toBe(ScopeType.catch);
}
function expectToBeClassScope(scope: Scope): asserts scope is ClassScope {
  expect(scope.type).toBe(ScopeType.class);
}
function expectToBeForScope(scope: Scope): asserts scope is ForScope {
  expect(scope.type).toBe(ScopeType.for);
}
function expectToBeFunctionScope(scope: Scope): asserts scope is FunctionScope {
  expect(scope.type).toBe(ScopeType.function);
}
function expectToBeFunctionExpressionNameScope(
  scope: Scope,
): asserts scope is FunctionExpressionNameScope {
  expect(scope.type).toBe(ScopeType.functionExpressionName);
}
function expectToBeGlobalScope(scope: Scope): asserts scope is GlobalScope {
  expect(scope.type).toBe(ScopeType.global);
}
function expectToBeModuleScope(scope: Scope): asserts scope is ModuleScope {
  expect(scope.type).toBe(ScopeType.module);
}
function expectToBeSwitchScope(scope: Scope): asserts scope is SwitchScope {
  expect(scope.type).toBe(ScopeType.switch);
}
function expectToBeWithScope(scope: Scope): asserts scope is WithScope {
  expect(scope.type).toBe(ScopeType.with);
}

function expectToBeIdentifier(
  node: TSESTree.Node | null | undefined,
): asserts node is TSESTree.Identifier {
  expect(node?.type).toBe(AST_NODE_TYPES.Identifier);
}

function expectToBeParameterDefinitionWithRest(def: Definition): void {
  expect(def).toBeInstanceOf(ParameterDefinition);
  const paramDef = def as ParameterDefinition;
  expect(paramDef.rest).toBeTruthy();
}

export {
  expectToBeBlockScope,
  expectToBeCatchScope,
  expectToBeClassScope,
  expectToBeForScope,
  expectToBeFunctionExpressionNameScope,
  expectToBeFunctionScope,
  expectToBeGlobalScope,
  expectToBeModuleScope,
  expectToBeParameterDefinitionWithRest,
  expectToBeSwitchScope,
  expectToBeWithScope,
  expectToBeIdentifier,
};
