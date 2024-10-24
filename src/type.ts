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
export type FlatTreeNodeValue<TValues> = { id: ID } & Omit<TreeNode<TValues>, "id" | "children">;
export type FlatTreeNode<TValues> = { id: ID; value: FlatTreeNodeValue<TValues>; _context: FlatTreeNodeContext };
export type FlatTree<TValues> = [ID, FlatTreeNode<TValues>][];

export type FlatDiffTreeNodeValue<TValues> = {
  change: Change;
  oldNode?: FlatTreeNode<TValues>;
  newNode?: FlatTreeNode<TValues>;
  isCross?: boolean;
};
export type FlatDiffTreeNode<TValues> = [ID, FlatDiffTreeNodeValue<TValues>];
export type FlatDiffTree<TValues> = FlatDiffTreeNode<TValues>[];

export type DiffTreeNode<TValues> = {
  id: ID;
  change: Change;
  detail: {
    newNode?: FlatTreeNodeValue<TValues>;
    newPath?: string[];
    oldNode?: FlatTreeNodeValue<TValues>;
    oldPath?: string[];
    isCross?: boolean;
  };
  children: DiffTreeNode<TValues>[];
};
export type DiffTree<TValues> = [DiffTreeNode<TValues>] | [DiffTreeNode<TValues>, DiffTreeNode<TValues>];
export type DiffResult<TValues> = { diffTree: DiffTree<TValues>; isChange: boolean };
