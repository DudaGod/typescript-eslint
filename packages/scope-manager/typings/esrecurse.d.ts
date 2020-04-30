declare module 'esrecurse' {
  import { TSESTree } from '@typescript-eslint/experimental-utils';
  // eslint-disable-next-line import/no-extraneous-dependencies
  import { Visitor as VisitorType } from '@typescript-eslint/scope-manager/dist/Visitor';

  const Visitor: unknown;
  function visit(
    node: unknown,
    visitor: Record<string, (this: VisitorType, node: TSESTree.Node) => void>,
  ): void;
  export { Visitor, visit };
}
