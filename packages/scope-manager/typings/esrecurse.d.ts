declare module 'esrecurse' {
  import { TSESTree } from '@typescript-eslint/experimental-utils';
  // eslint-disable-next-line import/no-extraneous-dependencies
  import { VisitorKeys } from 'eslint-visitor-keys';

  type FallbackFn = (node: {}) => string[];
  interface VisitorOptions {
    processRightHandNodes?: boolean;
    childVisitorKeys?: VisitorKeys;
    fallback?: 'iteration' | ((node: {}) => string[]);
  }

  class Visitor {
    protected __fallback: FallbackFn;
    protected __visitor: Visitor;
    protected __childVisitorKeys: VisitorKeys;

    public constructor(visitor: Visitor | null, options: VisitorOptions);

    /**
     * Default method for visiting children.
     * When you need to call default visiting operation inside custom visiting
     * operation, you can use it with `this.visitChildren(node)`.
     */
    public visitChildren(node: TSESTree.Node): void;

    /**
     * Dispatching node.
     */
    public visit(node: TSESTree.Node | null): void;
  }

  const version: string;
  function visit(
    node: TSESTree.Node,
    visitor: Visitor,
    options: VisitorOptions,
  ): void;

  export { version, visit, Visitor, VisitorOptions };
}
