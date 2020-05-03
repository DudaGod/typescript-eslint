import { TSESTree, AST_NODE_TYPES } from './ts-estree';
import { visitorKeys } from './visitor-keys';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidNode(x: any): x is TSESTree.Node {
  return x !== null && typeof x === 'object' && typeof x.type === 'string';
}

function getVisitorKeysForNode(
  allVisitorKeys: typeof visitorKeys,
  node: TSESTree.Node,
): readonly string[] {
  const keys = allVisitorKeys[node.type];
  return keys ?? [];
}

type SimpleTraverseOptions =
  | {
      [type in AST_NODE_TYPES]?: (
        node: Extract<TSESTree.Node, { type: type }>,
        parent: TSESTree.Node | undefined,
      ) => void;
    }
  | {
      enter: (node: TSESTree.Node, parent: TSESTree.Node | undefined) => void;
    };

class SimpleTraverser {
  private readonly allVisitorKeys = visitorKeys;
  private readonly selectors: SimpleTraverseOptions;

  constructor(selectors: SimpleTraverseOptions) {
    this.selectors = selectors;
  }

  traverse(node: unknown, parent: TSESTree.Node | undefined): void {
    if (!isValidNode(node)) {
      return;
    }

    if ('enter' in this.selectors) {
      this.selectors.enter(node, parent);
    } else if (node.type in this.selectors) {
      this.selectors[node.type]?.(node as never, parent);
    }

    const keys = getVisitorKeysForNode(this.allVisitorKeys, node);
    if (keys.length < 1) {
      return;
    }

    for (const key of keys) {
      const childOrChildren = node[key as keyof TSESTree.Node];

      if (Array.isArray(childOrChildren)) {
        for (const child of childOrChildren) {
          this.traverse(child, node);
        }
      } else {
        this.traverse(childOrChildren, node);
      }
    }
  }
}

export function simpleTraverse(
  startingNode: TSESTree.Node,
  options: SimpleTraverseOptions,
): void {
  new SimpleTraverser(options).traverse(startingNode, undefined);
}
