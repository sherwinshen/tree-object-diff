import { FlatTree, Tree, TreeNode } from './type';

export function flattenTree<TValues>(tree: Tree<TValues>) {
  const flatTree: FlatTree<TValues> = [];

  function traverse(tree: TreeNode<TValues>, parentNode: string | number, index: number, path: string[]) {
    const { id, children, ...values } = tree;
    flatTree.push([id, { id, values: values as TValues, _context: { parentNode, index, path } }]);
    if (!children || children.length === 0) return;
    for (let index = 0; index < children.length; index++) {
      traverse(children[index], id, index, [...path, 'children', String(index)]);
    }
  }

  traverse(tree, '', -1, []);

  return flatTree;
}
