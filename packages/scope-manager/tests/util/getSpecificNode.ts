import {
  simpleTraverse,
  AST_NODE_TYPES,
  TSESTree,
} from '@typescript-eslint/experimental-utils';

function getSpecificNode<
  TSelector extends AST_NODE_TYPES,
  TNode extends Extract<TSESTree.Node, { type: TSelector }>
>(ast: TSESTree.Node, selector: TSelector): TNode;
function getSpecificNode<
  TSelector extends AST_NODE_TYPES,
  TNode extends Extract<TSESTree.Node, { type: TSelector }>,
  TReturnType extends TSESTree.Node = TNode
>(
  ast: TSESTree.Node,
  selector: TSelector,
  cb: (node: TNode) => TReturnType | null | undefined,
): TReturnType;

function getSpecificNode<
  TSelector extends AST_NODE_TYPES,
  TNode extends Extract<TSESTree.Node, { type: TSelector }>,
  TReturnType extends TSESTree.Node = TNode
>(
  ast: TSESTree.Node,
  selector: TSelector,
  cb?: (node: TNode) => TReturnType | null | undefined,
): TReturnType {
  let node: TReturnType | null | undefined = null;
  simpleTraverse(
    ast,
    {
      [selector](n: TNode) {
        const res = cb ? cb(n) : ((n as never) as TReturnType);
        if (res) {
          // the callback shouldn't match multiple nodes or else tests may behave weirdly
          expect(node).toBeFalsy();
          node = res;
        }
      },
    },
    true,
  );

  expect(node).not.toBeFalsy();
  return node!;
}

export { getSpecificNode };
