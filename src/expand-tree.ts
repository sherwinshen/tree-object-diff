import { DiffTreeNode, FlatDiffTree, FlatDiffTreeNode } from './type';

export function expandTree<TValues>(flatTree: FlatDiffTree<TValues>): DiffTreeNode<TValues> {
  const [root, ...nodes] = flatTree;
  const { _context, ...rest } = root![1];

  return {
    ...rest,
    children: expandNodes(nodes, root![1].id),
  };
}

function expandNodes<TValues>(flatNodes: FlatDiffTreeNode<TValues>[], parentNode: string | number) {
  const children = flatNodes
    .filter(([, { _context: address }]) => address.parentNode === parentNode)
    .sort(([, nodeA], [, nodeB]) => nodeA._context.index - nodeB._context.index);
  const remainingNodes = flatNodes.filter(([_, node]) => !children.find(([_, child]) => node.id === child.id));
  return children.map(([_, child]) => {
    const { _context: address, ...rest } = child;
    const expandedNode = {
      ...rest,
      children: expandNodes(remainingNodes, rest.id),
    } as DiffTreeNode<TValues>;

    return expandedNode;
  });
}
