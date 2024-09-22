export enum CHANGE_TYPE {
  Added = 'added',
  Deleted = 'deleted',
  Moved = 'moved',
  Updated = 'updated',
  Unchanged = 'unchanged',
}

export type TreeNode<TValues> = { id: string | number; children?: TreeNode<TValues>[] } & TValues;
export type Tree<TValues> = TreeNode<TValues>;

export type FlatTreeNodeContext = { parentNode: string | number; index: number; path: string[] };
export type FlatTreeNodeData<TValues> = { id: string | number; values: TValues };
export type FlatTreeNode<TValues> = FlatTreeNodeData<TValues> & { _context: FlatTreeNodeContext };
export type FlatTree<TValues> = [string | number, FlatTreeNode<TValues>][];

export type Change =
  | [CHANGE_TYPE.Unchanged]
  | [CHANGE_TYPE.Added]
  | [CHANGE_TYPE.Deleted]
  | [CHANGE_TYPE.Moved]
  | [CHANGE_TYPE.Updated]
  | [CHANGE_TYPE.Moved, CHANGE_TYPE.Updated];
export type FlatDiffTreeNodeValue<TValues> = FlatTreeNode<TValues> & { change: Change };
export type FlatDiffTreeNode<TValues> = [string | number, FlatDiffTreeNodeValue<TValues>];
export type FlatDiffTree<TValues> = FlatDiffTreeNode<TValues>[];

export type DiffTreeNode<TValues> = { id: string | number; children: DiffTreeNode<TValues>[]; values: TValues; change: Change };
export type DiffTree<TValue> = [DiffTreeNode<TValue>] | [DiffTreeNode<TValue>, DiffTreeNode<TValue>];

export type NodeValue<TValues> = { id: string | number; values: TValues };
export type DiffDetailValue<TValues> =
  | { node: NodeValue<TValues>; path: string[] }
  | { oldNode: NodeValue<TValues>; oldPath?: string[]; newNode: NodeValue<TValues>; newPath: string[] };
export type DiffDetail<TValues> = Record<CHANGE_TYPE, DiffDetailValue<TValues>[]>;
