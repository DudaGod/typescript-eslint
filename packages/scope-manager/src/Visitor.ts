import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Visitor as ESRecurseVisitor } from 'esrecurse';

type FallbackFn = (node: {}) => string[];
interface VisitorKeys {
  readonly [type: string]: ReadonlyArray<string> | undefined;
}
interface VisitorOptions {
  processRightHandNodes?: boolean;
  childVisitorKeys?: VisitorKeys | null;
  fallback?: 'iteration' | FallbackFn;
}

declare class VisitorType {
  __fallback: FallbackFn;
  __visitor: VisitorType;
  __childVisitorKeys: VisitorKeys;

  constructor(visitor: VisitorType | null, options: VisitorOptions);

  /**
   * Default method for visiting children.
   * When you need to call default visiting operation inside custom visiting
   * operation, you can use it with `this.visitChildren(node)`.
   */
  visitChildren(node: TSESTree.Node): void;

  /**
   * Dispatching node.
   */
  visit(node: TSESTree.Node | null): void;
}
const Visitor = ESRecurseVisitor as typeof VisitorType;

export { Visitor, VisitorOptions, VisitorKeys };
