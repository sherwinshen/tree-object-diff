![logo](./logo.png)

TreeObjectDiff is a small, fast and zero-dependency utility for comparing and identifying differences between tree-structured objects. Unlike tools such as [microdiff](https://github.com/AsyncBanana/microdiff) or [deep-object-diff](https://github.com/mattphillips/deep-object-diff), which can only detect property additions, deletions, and value modifications in objects, TreeObjectDiff provides more comprehensive change detection, including node additions, deletions, moves, updates, and unchanged states. Inspired by Vue's virtual DOM diff algorithm, this tool supports both level-by-level and cross-level diffing of tree-structured nodes. TreeObjectDiff allows identification of all node movements regardless of their position in the tree hierarchy and provides a more comprehensive diff result.

![Minizipped Size (from Bundlephobia)](https://img.shields.io/bundlephobia/minzip/tree-object-diff?style=flat-square) ![License](https://img.shields.io/npm/l/tree-object-diff?style=flat-square) ![dependency Count](https://img.shields.io/badge/dependencies-0-green?style=flat-square) ![downloads](https://img.shields.io/npm/dm/tree-object-diff.svg?style=flat-square)

# Features

1. **Identifies Moved Elements**: Uses unique identifiers for cross-level comparison.
2. **Detects Changes**: Detects node additions, deletions, moves, and updates.
3. **Customizable Comparison**: Supports custom functions for complex data value comparisons.
4. **Detailed Reports**: Provides comprehensive diff reports.
5. **Lightweight**: No dependencies required.
6. **TypeScript Ready**: Fully compatible with TypeScript.

It is worth mentioning that for the comparison of node movement, nodes at the same level will not be compared directly based on the index. Instead, the minimum number of movement changes will be given (based on the longest_increasing_subsequence algorithm).

# Installation

```shell
npm i --save tree-object-diff
```

# Usage

The tree object structure is as follows:

```typescript
type TreeNode<TValues> = { id: number | string; children?: TreeNode<TValues>[] } & TValues;
type Tree<TValues> = TreeNode<TValues>;
```

The diff result structure is as follows:

```typescript
type DiffTreeNode<TValues> = {
  id: number | string;
  change: Change;
  detail: {
    newNode?: Omit<TreeNode<TValues>, "children">;
    newPath?: string[];
    oldNode?: Omit<TreeNode<TValues>, "children">;
    oldPath?: string[];
  };
  children: DiffTreeNode<TValues>[];
};
type DiffTree<TValue> = [DiffTreeNode<TValue>] | [DiffTreeNode<TValue>, DiffTreeNode<TValue>];
type DiffResult<TValues> = { diffTree: DiffTree<TValues>; isChange: boolean };
```

Where a `Change` is:

```typescript
type Change =
  | [CHANGE_TYPE.Unchanged]
  | [CHANGE_TYPE.Added]
  | [CHANGE_TYPE.Deleted]
  | [CHANGE_TYPE.Moved]
  | [CHANGE_TYPE.Updated]
  | [CHANGE_TYPE.Moved, CHANGE_TYPE.Updated];
```

Here's a basic example of how to use TreeObjectDiff to compare two tree objects:

![example](./example.png)

```typescript
import { diff } from "tree-object-diff";

const oldTreeObject = {
  id: "1",
  value: "a",
  children: [
    { id: "2", value: "b", children: [] },
    {
      id: "3",
      value: "c",
      children: [
        { id: "4", value: "d", children: [] },
        { id: "5", value: "e", children: [] },
        { id: "6", value: "f", children: [] },
      ],
    },
  ],
};

const newTreeObject = {
  id: "1",
  value: "a",
  children: [
    { id: "7", value: "g", children: [] },
    {
      id: "3",
      value: "cc",
      children: [
        { id: "5", value: "e", children: [] },
        { id: "4", value: "d", children: [] },
      ],
    },
    { id: "6", value: "f", children: [] },
  ],
};

const { diffTree, isChange } = diff(oldTreeObject, newTreeObject);

/* ------------- result ------------- */
const isChange = true;
const diffTree = [
  {
    id: "1",
    change: ["unchanged"],
    detail: {
      newNode: { "id": "1", value: "a" },
      newPath: [],
      oldNode: { "id": "1", value: "a" },
      oldPath: [],
    },
    children: [
      {
        id: "2",
        change: ["deleted"],
        detail: {
          newNode: { "id": "2", value: "b" },
          oldPath: ["children", "0"],
        },
        children: [],
      },
      {
        id: "7",
        change: ["added"],
        detail: {
          newNode: { "id": "7", value: "g" },
          newPath: ["children", "0"],
        },
        children: [],
      },
      {
        id: "3",
        change: ["updated"],
        detail: {
          newNode: { "id": "3", value: "cc" },
          newPath: ["children", "1"],
          oldNode: { "id": "3", value: "c" },
          oldPath: ["children", "1"],
        },
        children: [
          {
            id: "5",
            change: ["moved"],
            detail: {
              newNode: { "id": "5", value: "e" },
              newPath: ["children", "1", "children", "0"],
              oldNode: { "id": "5", value: "e" },
              oldPath: ["children", "1", "children", "1"],
              isCross: false,
            },
            children: [],
          },
          {
            id: "4",
            change: ["unchanged"],
            detail: {
              newNode: { "id": "4", value: "d" },
              newPath: ["children", "1", "children", "1"],
              oldNode: { "id": "4", value: "d" },
              oldPath: ["children", "1", "children", "0"],
            },
            children: [],
          },
        ],
      },
      {
        id: "6",
        change: ["moved"],
        detail: {
          newNode: { id: "6", value: "f" },
          newPath: ["children", "2"],
          oldNode: { id: "6", value: "f" },
          oldPath: ["children", "1", "children", "2"],
          isCross: true,
        },
        children: [],
      },
    ],
  },
];
```

Each node's identifier is `id`, which is used to detect additions, deletions, and movements. To compare if a node's value has changed, we stringify the node object (excluding the `children` field) and compare the results. Fortunately, we also support custom value comparison: Node value comparison is used to detect updates. You can customize these behaviors by providing your own comparison functions.

```typescript
import { diff } from "tree-object-diff";

const sameNodeValue = (oldNode, newNode) => oldNode.curValue === newNode.curValue;
const { diffTree, isChange } = diff(oldTree, newTree, { valueEquality: sameNodeValue });
```

# License

MIT
