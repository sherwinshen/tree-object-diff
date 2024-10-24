import { Change, CHANGE_TYPE, DiffResult, DiffTree, FlatDiffTree, FlatTreeNode, Tree } from "./type";
import { expandTree, flattenTree, getLIS } from "./utils";

const defaultValueEquality = <TValues>(a: TValues, b: TValues) => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

const diff = <TValues>(
  oldTree: Tree<TValues>,
  newTree: Tree<TValues>,
  config?: { valueEquality?: (a: TValues, b: TValues) => boolean }
): DiffResult<TValues> => {
  let isChange = false;
  const oldFlatTree = flattenTree(oldTree);
  const oldRoot = oldFlatTree.shift()![1];
  const oldNodes = new Map(oldFlatTree);

  const newFlatTree = flattenTree(newTree);
  const newRoot = newFlatTree.shift()![1];
  const newNodes = new Map(newFlatTree);

  const valueEquality = config?.valueEquality ?? defaultValueEquality;

  // 1. Find deleted nodes (no root node)
  const deletedNodes = [] as FlatDiffTree<TValues>;
  Array.from(oldNodes).forEach(([oldId, oldFlatNode]) => {
    if (!newNodes.get(oldId) && oldId !== newRoot.id) {
      deletedNodes.push([oldId, { change: [CHANGE_TYPE.Deleted], oldNode: oldFlatNode }]);
    }
  });

  // 2. Find added nodes and compare values (no root node)
  const addedNodes = [] as FlatDiffTree<TValues>;
  const restNodes = [] as FlatDiffTree<TValues>;
  Array.from(newNodes).forEach(([newId, newFlatNode]) => {
    const oldFlatNode = newId === oldRoot.id ? oldRoot : oldNodes.get(newId);
    const added = !oldFlatNode;
    if (added) {
      addedNodes.push([newId, { change: [CHANGE_TYPE.Added], newNode: newFlatNode }]);
    } else {
      const valueChanged = !valueEquality(newFlatNode?.value as TValues, oldFlatNode?.value as TValues);
      restNodes.push([
        newId,
        {
          change: valueChanged ? [CHANGE_TYPE.Updated] : [CHANGE_TYPE.Unchanged],
          newNode: newFlatNode,
          oldNode: oldFlatNode,
        },
      ]);
    }
  });

  // 3. Find moved nodes and determine updated/unchanged nodes
  const movedNodes = [] as FlatDiffTree<TValues>;
  const movedAndUpdateNodes = [] as FlatDiffTree<TValues>;
  const unchangedNodes = [] as FlatDiffTree<TValues>;
  const updatedNodes = [] as FlatDiffTree<TValues>;

  const mightMoveNodes = {} as {
    [key: string]: [FlatTreeNode<TValues>, FlatTreeNode<TValues>, Change][];
  };

  // 3.1 Find nodes that have moved across levels
  restNodes.forEach(([id, flatDiffTreeNodeValue]) => {
    const isOldRoot = id === oldRoot.id;
    const oldFlatNode = flatDiffTreeNodeValue.oldNode;
    const newFlatNode = flatDiffTreeNodeValue.newNode!;
    const change = flatDiffTreeNodeValue.change;
    if (!oldFlatNode) return;
    const { _context: oldContext } = oldFlatNode!;
    const { _context: newContext } = newFlatNode || {};
    const definitelyMoved = isOldRoot || oldContext?.parentNode !== newContext?.parentNode;
    if (definitelyMoved) {
      const isUpdated = change?.[0] === CHANGE_TYPE.Updated;
      movedNodes.push([
        id,
        {
          ...flatDiffTreeNodeValue,
          change: isUpdated ? [CHANGE_TYPE.Moved, CHANGE_TYPE.Updated] : [CHANGE_TYPE.Moved],
          isCross: true,
        },
      ]);
    } else {
      const newParentNode = newContext.parentNode;
      if (mightMoveNodes[newParentNode]) {
        mightMoveNodes[newParentNode].push([newFlatNode, oldFlatNode, change]);
      } else {
        mightMoveNodes[newParentNode] = [[newFlatNode, oldFlatNode, change]];
      }
    }
  });

  // 3.2 Find nodes that have moved within the same level (based on LIS algorithm)
  Object.values(mightMoveNodes).forEach((nodes) => {
    const oldNodesIndex = nodes.map(([_, oldFlatNode]) => oldFlatNode._context.index);
    const lisArr = getLIS(oldNodesIndex);
    nodes.forEach(([newFlatNode, oldFlatNode, change], index) => {
      const isUpdated = change?.[0] === CHANGE_TYPE.Updated;
      if (lisArr.includes(index)) {
        const tmpNodes = isUpdated ? updatedNodes : unchangedNodes;
        tmpNodes.push([newFlatNode.id, { change, newNode: newFlatNode, oldNode: oldFlatNode }]);
      } else if (isUpdated) {
        movedAndUpdateNodes.push([
          newFlatNode.id,
          {
            newNode: newFlatNode,
            oldNode: oldFlatNode,
            change: [CHANGE_TYPE.Moved, CHANGE_TYPE.Updated],
            isCross: false,
          },
        ]);
      } else {
        movedNodes.push([
          newFlatNode.id,
          { newNode: newFlatNode, oldNode: oldFlatNode, change: [CHANGE_TYPE.Moved], isCross: false },
        ]);
      }
    });
  });

  // 4. Handle root node and format result
  const isSameRoot = newRoot.id === oldRoot.id;
  const oldNodeToNewRoot = isSameRoot ? oldRoot : oldNodes.get(newRoot.id);
  const checkValueEquality = isSameRoot ? valueEquality(oldRoot.value as TValues, newRoot.value as TValues) : false;
  const checkNewValueEquality = isSameRoot
    ? checkValueEquality
    : valueEquality(oldNodeToNewRoot?.value as TValues, newRoot.value as TValues);
  let change;
  if (!oldNodeToNewRoot) {
    change = [CHANGE_TYPE.Added];
  } else {
    change = isSameRoot
      ? !checkNewValueEquality
        ? [CHANGE_TYPE.Updated]
        : [CHANGE_TYPE.Unchanged]
      : checkNewValueEquality
      ? [CHANGE_TYPE.Moved]
      : [CHANGE_TYPE.Moved, CHANGE_TYPE.Updated];
  }
  isChange = Boolean(
    deletedNodes.length || addedNodes.length || movedAndUpdateNodes.length || movedNodes.length || updatedNodes.length
  );
  if (change[0] !== CHANGE_TYPE.Unchanged) {
    isChange = true;
  }
  const flatDiffTree: FlatDiffTree<TValues> = [
    [
      newRoot.id,
      {
        change: change as Change,
        newNode: newRoot,
        oldNode: oldNodeToNewRoot,
        isCross: change[0] === CHANGE_TYPE.Moved ? true : undefined,
      },
    ],
    ...[...deletedNodes, ...addedNodes, ...movedAndUpdateNodes, ...movedNodes, ...updatedNodes, ...unchangedNodes],
  ];
  let expandTreeResult: DiffTree<TValues>;
  if (oldRoot.id !== undefined && oldRoot.id !== newRoot.id && !newNodes.get(oldRoot.id)) {
    isChange = true;
    expandTreeResult = [
      (expandTree(flatDiffTree),
      expandTree([[oldRoot.id, { oldNode: oldRoot, change: [CHANGE_TYPE.Deleted] }], ...deletedNodes])),
    ];
  } else {
    expandTreeResult = [expandTree(flatDiffTree)];
  }
  return { diffTree: expandTreeResult, isChange };
};

export { diff };
