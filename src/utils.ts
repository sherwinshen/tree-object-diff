import { DiffTreeNode, FlatDiffTree, FlatDiffTreeNode, FlatTree, ID, Tree, TreeNode } from "./type";

export function flattenTree<TValues>(tree: Tree<TValues>) {
  const flatTree: FlatTree<TValues> = [];

  function traverse(tree: TreeNode<TValues>, parentNode: ID, index: number, path: string[]) {
    const { id, children, ...value } = tree;
    flatTree.push([id, { id, value, _context: { parentNode, index, path } }]);
    if (!children || children.length === 0) return;
    for (let index = 0; index < children.length; index++) {
      traverse(children[index], id, index, [...path, "children", String(index)]);
    }
  }

  traverse(tree, "", -1, []);

  return flatTree;
}

function expandNodes<TValues>(flatNodes: FlatDiffTreeNode<TValues>[], parentNode: ID) {
  const children = flatNodes
    .filter(
      ([, { oldNode, newNode }]) =>
        newNode?._context?.parentNode === parentNode || oldNode?._context?.parentNode === parentNode
    )
    .sort(
      ([, { oldNode: oldNodeA, newNode: newNodeA }], [, { oldNode: oldNodeB, newNode: newNodeB }]) =>
        ((newNodeA || oldNodeA)?._context?.index ?? 0) - ((newNodeB || oldNodeB)?._context?.index ?? 0)
    );

  const remainingNodes = flatNodes.filter(
    ([, { oldNode, newNode }]) =>
      !children.find(
        ([, { oldNode: childOldNode, newNode: childNewNode }]) =>
          (oldNode?.id || newNode?.id) === (childOldNode?.id || childNewNode?.id)
      )
  );
  return children.map(([_, { oldNode, newNode, change }]) => {
    const id = newNode?.id || oldNode?.id;
    const expandedNode = {
      id,
      change,
      detail: {
        newValue: newNode?.value,
        newPath: newNode?._context?.path,
        oldValue: oldNode?.value,
        oldPath: oldNode?._context?.path,
      },

      children: expandNodes(remainingNodes, id!),
    } as DiffTreeNode<TValues>;

    return expandedNode;
  });
}

export function expandTree<TValues>(flatTree: FlatDiffTree<TValues>): DiffTreeNode<TValues> {
  const [root, ...nodes] = flatTree;
  const { newNode, oldNode, change } = root![1];
  return {
    id: newNode?.id || oldNode?.id || "",
    change,
    detail: {
      newValue: newNode?.value,
      newPath: newNode?._context.path,
      oldValue: oldNode?.value,
      oldPath: oldNode?._context.path,
    },
    children: expandNodes(nodes, root[0]),
  };
}

/**
 * LIS Algorithm
 * https://en.wikipedia.org/wiki/Longest_increasing_subsequence
 */
export const getLIS = (arr: number[]) => {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI >= 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
};
