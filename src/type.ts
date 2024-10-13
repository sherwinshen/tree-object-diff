export enum CHANGE_TYPE {
  Added = "added",
  Deleted = "deleted",
  Moved = "moved",
  Updated = "updated",
  Unchanged = "unchanged",
}

export type Change =
  | [CHANGE_TYPE.Unchanged]
  | [CHANGE_TYPE.Added]
  | [CHANGE_TYPE.Deleted]
  | [CHANGE_TYPE.Moved]
  | [CHANGE_TYPE.Updated]
  | [CHANGE_TYPE.Moved, CHANGE_TYPE.Updated];

export type ID = string | number;

export type TreeNode<TValues> = { id: ID; children?: TreeNode<TValues>[] } & TValues;
export type Tree<TValues> = TreeNode<TValues>;

export type FlatTreeNodeContext = { parentNode: ID; index: number; path: string[] };
export type FlatTreeNodeValue<TValues> = Omit<TreeNode<TValues>, "id" | "children">;
export type FlatTreeNode<TValues> = { id: ID; value: FlatTreeNodeValue<TValues>; _context: FlatTreeNodeContext };
export type FlatTree<TValues> = [ID, FlatTreeNode<TValues>][];

export type FlatDiffTreeNodeValue<TValues> = {
  change: Change;
  oldNode?: FlatTreeNode<TValues>;
  newNode?: FlatTreeNode<TValues>;
};
export type FlatDiffTreeNode<TValues> = [ID, FlatDiffTreeNodeValue<TValues>];
export type FlatDiffTree<TValues> = FlatDiffTreeNode<TValues>[];

export type DiffTreeNode<TValues> = {
  id: ID;
  change: Change;
  detail: {
    newValue?: FlatTreeNodeValue<TValues>;
    newPath?: string[];
    oldValue?: FlatTreeNodeValue<TValues>;
    oldPath?: string[];
  };
  children: DiffTreeNode<TValues>[];
};
export type DiffTree<TValue> = [DiffTreeNode<TValue>] | [DiffTreeNode<TValue>, DiffTreeNode<TValue>];
