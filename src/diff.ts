import { Change, CHANGE_TYPE, DiffDetail, DiffTree, FlatDiffTree, FlatDiffTreeNode, FlatDiffTreeNodeValue, FlatTreeNode, Tree } from './type';
import { flattenTree } from './flatten-tree';
import { expandTree } from './expand-tree';
import { getLIS } from './utils';

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
  config?: {
    valueEquality: (a: TValues, b: TValues) => boolean;
    resultMode: 'tree' | 'detail';
  }
) => {
  const oldFlatTree = flattenTree(oldTree);
  const oldRoot = oldFlatTree.shift()![1];
  const oldNodes = new Map(oldFlatTree);

  const newFlatTree = flattenTree(newTree);
  const newRoot = newFlatTree.shift()![1];
  const newNodes = new Map(newFlatTree);

  const valueEquality = config?.valueEquality ?? defaultValueEquality;
  const resultMode = config?.resultMode || 'tree';

  // 1. Find deleted nodes (no root node)
  const deletedNodes = [] as FlatDiffTree<TValues>;
  Array.from(oldNodes).forEach(([oldId, oldFlatNode]) => {
    if (!newNodes.get(oldId) && oldId !== newRoot.id) {
      deletedNodes.push([oldId, { ...oldFlatNode, change: [CHANGE_TYPE.Deleted] }]);
    }
  });

  // 2. Find added nodes and compare values (no root node)
  const addedNodes = [] as FlatDiffTree<TValues>;
  const restNodes = [] as FlatDiffTree<TValues>;
  Array.from(newNodes).forEach(([newId, newFlatNode]) => {
    const oldFlatNode = newId === oldRoot.id ? oldRoot : oldNodes.get(newId);
    const added = !oldFlatNode;
    if (added) {
      addedNodes.push([newId, { ...newFlatNode, change: [CHANGE_TYPE.Added] }]);
    } else {
      const valueChanged = oldFlatNode ? !valueEquality(newFlatNode.values, oldFlatNode.values) : false;
      restNodes.push([newId, { ...newFlatNode, change: valueChanged ? [CHANGE_TYPE.Updated] : [CHANGE_TYPE.Unchanged] }]);
    }
  });

  // 3. Find moved nodes and determine updated/unchanged nodes
  const movedNodes = [] as FlatDiffTree<TValues>;
  const movedAndUpdateNodes = [] as FlatDiffTree<TValues>;
  const unchangedNodes = [] as FlatDiffTree<TValues>;
  const updatedNodes = [] as FlatDiffTree<TValues>;

  const mightMoveNodes = {} as {
    [key: string]: [FlatDiffTreeNodeValue<TValues>, FlatTreeNode<TValues>][];
  };

  // 3.1 Find nodes that have moved across levels
  restNodes.forEach(([newId, newFlatDiffNode]) => {
    const isOldRoot = newId === oldRoot.id;
    const oldFlatNode = isOldRoot ? oldRoot : oldNodes.get(newId);
    if (!oldFlatNode) return;
    const { _context: oldContext } = oldFlatNode!;
    const { _context: newContext, change } = newFlatDiffNode;
    const definitelyMoved = isOldRoot || oldContext?.parentNode !== newContext?.parentNode;
    if (definitelyMoved) {
      const isUpdated = change?.[0] === CHANGE_TYPE.Updated;
      movedNodes.push([newId, { ...newFlatDiffNode, change: isUpdated ? [CHANGE_TYPE.Moved, CHANGE_TYPE.Updated] : [CHANGE_TYPE.Moved] }]);
    } else {
      const newParentNode = newContext.parentNode;
      if (mightMoveNodes[newParentNode]) {
        mightMoveNodes[newParentNode].push([newFlatDiffNode, oldFlatNode]);
      } else {
        mightMoveNodes[newParentNode] = [[newFlatDiffNode, oldFlatNode]];
      }
    }
  });

  // 3.2 Find nodes that have moved within the same level (based on LIS algorithm)
  Object.values(mightMoveNodes).forEach((nodes) => {
    const oldNodesIndex = nodes.map(([_, data]) => data._context.index);
    const lisArr = getLIS(oldNodesIndex);
    nodes.forEach(([newFlatDiffNode], index) => {
      const isUpdated = newFlatDiffNode.change[0] === CHANGE_TYPE.Updated;
      if (lisArr.includes(index)) {
        if (isUpdated) {
          updatedNodes.push([newFlatDiffNode.id, { ...newFlatDiffNode }]);
        } else {
          unchangedNodes.push([newFlatDiffNode.id, { ...newFlatDiffNode }]);
        }
      } else {
        if (isUpdated) {
          movedAndUpdateNodes.push([newFlatDiffNode.id, { ...newFlatDiffNode, change: [CHANGE_TYPE.Moved, CHANGE_TYPE.Updated] }]);
        } else {
          movedNodes.push([newFlatDiffNode.id, { ...newFlatDiffNode, change: [CHANGE_TYPE.Moved] }]);
        }
      }
    });
  });

  // 4. Handle root node and format result
  const isSameRoot = newRoot.id === oldRoot.id;
  const oldNodeToNewRoot = isSameRoot ? oldRoot : oldNodes.get(newRoot.id);
  const newNodeToOldRoot = isSameRoot ? newRoot : newNodes.get(oldRoot.id);
  const checkValueEquality = isSameRoot ? valueEquality(oldRoot.values, newRoot.values) : false;
  const checkNewValueEquality = isSameRoot ? checkValueEquality : valueEquality(oldNodeToNewRoot!?.values, newRoot.values);
  if (resultMode === 'tree') {
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
    const flatDiffTree: FlatDiffTree<TValues> = [
      [newRoot.id, { ...newRoot, change: change as Change }],
      ...[...addedNodes, ...deletedNodes, ...movedNodes, ...updatedNodes, ...movedAndUpdateNodes, ...unchangedNodes],
    ];
    let expandTreeResult: DiffTree<TValues>;
    if (oldRoot.id !== newRoot.id && !newNodes.get(oldRoot.id)) {
      expandTreeResult = [(expandTree(flatDiffTree), expandTree([[oldRoot.id, { ...oldRoot, change: [CHANGE_TYPE.Deleted] }], ...deletedNodes]))];
    } else {
      expandTreeResult = [expandTree(flatDiffTree)];
    }
    return expandTreeResult;
  }

  const formatFunc1 = ([_, node]: FlatDiffTreeNode<TValues>) => ({ node: { id: node.id, values: node.values }, path: node._context.path });
  const formatFunc2 = ([_, newNode]: FlatDiffTreeNode<TValues>) => {
    const oldNode = newNode.id === oldRoot.id ? oldRoot : oldNodes.get(newNode.id);
    return {
      oldNode: { id: oldNode!.id, values: oldNode!.values },
      oldPath: oldNode!._context.path,
      newNode: { id: newNode.id, values: newNode.values },
      newPath: newNode._context.path,
    };
  };

  const diffDetail: DiffDetail<TValues> = {
    [CHANGE_TYPE.Added]: addedNodes.map(formatFunc1),
    [CHANGE_TYPE.Deleted]: deletedNodes.map(formatFunc1),
    [CHANGE_TYPE.Moved]: [...movedNodes, ...movedAndUpdateNodes].map(formatFunc2),
    [CHANGE_TYPE.Unchanged]: updatedNodes.map(formatFunc1),
    [CHANGE_TYPE.Updated]: [...updatedNodes, ...movedAndUpdateNodes].map(formatFunc2),
  };

  if (!newNodeToOldRoot) {
    diffDetail[CHANGE_TYPE.Deleted].push({ node: { id: oldRoot.id, values: oldRoot.values }, path: oldRoot._context.path });
    // deletedNodes.push([oldRoot.id, { ...oldRoot, change: [CHANGE_TYPE.Deleted] }]);
  } else if (!oldNodeToNewRoot) {
    diffDetail[CHANGE_TYPE.Added].push({ node: { id: newRoot.id, values: newRoot.values }, path: newRoot._context.path });
    // addedNodes.push([newRoot.id, { ...newRoot, change: [CHANGE_TYPE.Added] }]);
  } else {
    const diffData1 = { node: { id: newRoot.id, values: newRoot.values }, path: newRoot._context.path };
    const diffData2 = {
      oldNode: { id: oldNodeToNewRoot.id, values: oldNodeToNewRoot.values },
      oldPath: oldNodeToNewRoot._context.path,
      newNode: { id: newRoot.id, values: newRoot.values },
      newPath: newRoot._context.path,
    };
    if (isSameRoot) {
      if (checkNewValueEquality) {
        diffDetail[CHANGE_TYPE.Unchanged].push(diffData1);
      } else {
        diffDetail[CHANGE_TYPE.Updated].push(diffData2);
      }
    } else {
      if (checkNewValueEquality) {
        diffDetail[CHANGE_TYPE.Updated].push(diffData2);
      } else {
        diffDetail[CHANGE_TYPE.Updated].push(diffData2);
        diffDetail[CHANGE_TYPE.Moved].push(diffData2);
      }
    }
  }
  return diffDetail;
};

export { diff };
