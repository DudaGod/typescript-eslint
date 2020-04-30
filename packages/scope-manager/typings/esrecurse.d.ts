declare module 'esrecurse' {
  import { TSESTree } from '@typescript-eslint/experimental-utils';

  const Visitor: unknown;
  function visit(
    node: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visitor: Record<string, (this: any, node: TSESTree.Node) => void>,
  ): void;
  export { Visitor, visit };
}
