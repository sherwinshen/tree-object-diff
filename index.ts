export type TreeNodeT = {
  id: string | number;
  [key: string]: any;
  children?: TreeNodeT[];
};
export type TreeDataT = TreeNodeT | TreeNodeT[];

export enum DIFF_TYPE {
  ADD = "ADD",
  DELETE = "DELETE",
  UPDATE = "UPDATE",
  MOVE = "MOVE",
}
export type DiffItemT = {
  oldNode?: TreeNodeT;
  newNode?: TreeNodeT;
  oldPath?: string[];
  newPath?: string[];
};

type DiffResultMapT = Record<DIFF_TYPE, DiffItemT[]>;
type DiffResultListT = DiffItemT & { type: DIFF_TYPE }[];
export type DiffResultT = { map: DiffResultMapT; list: DiffResultListT };

export type CheckFuncType = (oldNode: TreeNodeT, newNode: TreeNodeT) => boolean;

/**
 * LIS Algorithm
 * https://en.wikipedia.org/wiki/Longest_increasing_subsequence
 */
const getLIS = (arr: number[]): number[] => {
  const n = arr.length;
  const dp: number[] = new Array(n).fill(1);
  const prev: number[] = new Array(n).fill(-1);
  let maxLength = 0;
  let endIndex = 0;

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (arr[i] > arr[j] && dp[i] < dp[j] + 1) {
        dp[i] = dp[j] + 1;
        prev[i] = j;
      }
    }
    if (dp[i] > maxLength) {
      maxLength = dp[i];
      endIndex = i;
    }
  }

  const result: number[] = [];
  while (endIndex !== -1) {
    result.unshift(endIndex);
    endIndex = prev[endIndex];
  }

  return result;
};

const toArray = (data: TreeDataT): TreeNodeT[] => (Array.isArray(data) ? data : [data]);
const omitChildren = ({ children, ...rest }: TreeNodeT) => rest;
const defaultGetNodeId = (node: TreeNodeT) => node?.id;
const defaultSameNodeCheck = (oldNode: TreeNodeT, newNode: TreeNodeT) => defaultGetNodeId(oldNode) === defaultGetNodeId(newNode);
const defaultSameValueCheck = (oldNode: TreeNodeT, newNode: TreeNodeT) => JSON.stringify(omitChildren(oldNode)) === JSON.stringify(omitChildren(newNode));

export function useTreeObjectDiff({
  sameNodeCheck = defaultSameNodeCheck,
  sameValueCheck = defaultSameValueCheck,
  getNodeId = defaultGetNodeId,
}: {
  sameNodeCheck?: CheckFuncType;
  sameValueCheck?: CheckFuncType;
  getNodeId?: (data: TreeNodeT) => string | number;
} = {}) {
  const diff = (oldData: TreeDataT, newData: TreeDataT, mode: "map" | "list" = "map"): DiffResultMapT | DiffResultListT => {
    const differenceData: DiffResultT = {
      map: {
        [DIFF_TYPE.ADD]: [],
        [DIFF_TYPE.DELETE]: [],
        [DIFF_TYPE.UPDATE]: [],
        [DIFF_TYPE.MOVE]: [],
      },
      list: [],
    };

    const addDiff = (type: DIFF_TYPE, oldNode: TreeNodeT | undefined, newNode: TreeNodeT | undefined, oldPath: string[], newPath: string[]) => {
      const isOmitChildren = type === DIFF_TYPE.ADD || type === DIFF_TYPE.DELETE;
      const data = {
        oldNode: !isOmitChildren && oldNode ? omitChildren(oldNode) : oldNode,
        newNode: !isOmitChildren && newNode ? omitChildren(newNode) : newNode,
        oldPath,
        newPath,
      };
      differenceData.map[type].push(data);
      differenceData.list.push({ type, ...data });
    };

    const diffSameLevel = (oldDataArray: TreeNodeT[], newDataArray: TreeNodeT[], oldPath: string[], newPath: string[]) => {
      let i = 0;
      let e1 = oldDataArray.length - 1;
      let e2 = newDataArray.length - 1;

      // 1. 头部节点对比
      while (i <= e1 && i <= e2 && sameNodeCheck(oldDataArray[i], newDataArray[i])) {
        if (!sameValueCheck(oldDataArray[i], newDataArray[i])) {
          addDiff(DIFF_TYPE.UPDATE, oldDataArray[i], newDataArray[i], [...oldPath, String(i)], [...newPath, String(i)]);
        }
        diffSameLevel(
          oldDataArray[i]?.children || [],
          newDataArray[i]?.children || [],
          [...oldPath, String(i), "children"],
          [...newPath, String(i), "children"]
        );
        i++;
      }

      // 2. 尾部节点对比
      while (e1 >= i && e2 >= i && sameNodeCheck(oldDataArray[e1], newDataArray[e2])) {
        if (!sameValueCheck(oldDataArray[e1], newDataArray[e2])) {
          addDiff(DIFF_TYPE.UPDATE, oldDataArray[e1], newDataArray[e2], [...oldPath, String(e1)], [...newPath, String(e2)]);
        }
        diffSameLevel(
          oldDataArray[e1]?.children || [],
          newDataArray[e2]?.children || [],
          [...oldPath, String(e1), "children"],
          [...newPath, String(e2), "children"]
        );
        e1--;
        e2--;
      }

      // 3. 如果旧节点遍历完了, 依然有新的节点, 那么新的节点就是添加
      if (i > e1) {
        while (i <= e2) {
          addDiff(DIFF_TYPE.ADD, undefined, newDataArray[i], [], [...newPath, String(i)]);
          i++;
        }
      }

      // 4. 如果新节点遍历完了, 依然有旧的节点, 那么旧的节点就是删除
      else if (i > e2) {
        while (i <= e1) {
          addDiff(DIFF_TYPE.DELETE, oldDataArray[i], undefined, [...oldPath, String(i)], []);
          i++;
        }
      }

      // 5. 头尾节点对比完后, 剩下的节点就是交叉对比
      else {
        let s1 = i; // s1旧子节点头指针
        let s2 = i; // s2新子节点头指针
        let patched = 0; // 已经修复的新节点数量
        const toBePatched = e2 - s2 + 1; // 新节点待修复的数量
        const keyToNewIndexMap = new Map(newDataArray.slice(i, e2 + 1).map((node, index) => [getNodeId(node), index + i])); // 新节点索引 id:index
        const newIndexToOldIndexMap = new Array(toBePatched).fill(0); // 用于计算最长递增子序列
        const oldIndexToNewIndexMap = new Map(); // newIndex: oldIndex
        let moved = false;
        let maxNewIndexSoFar = 0;
        // 遍历旧子节点
        for (let j = s1; j <= e1; j++) {
          const oldNode = oldDataArray[j];
          // 所有的新子节点都已经处理完成，剩余的旧子节点全部删除即可
          if (patched >= toBePatched) {
            addDiff(DIFF_TYPE.DELETE, oldNode, undefined, [...oldPath, String(j)], []);
            continue;
          }
          const newIndex = keyToNewIndexMap.get(getNodeId(oldDataArray[j]));
          if (newIndex === undefined) {
            addDiff(DIFF_TYPE.DELETE, oldDataArray[j], undefined, [...oldPath, String(j)], []);
          } else {
            oldIndexToNewIndexMap.set(newIndex, j);
            newIndexToOldIndexMap[newIndex - s2] = j + 1;
            if (newIndex >= maxNewIndexSoFar) {
              maxNewIndexSoFar = newIndex;
            } else {
              moved = true;
            }
            const newNode = newDataArray[newIndex];
            if (!sameValueCheck(oldNode, newNode)) {
              addDiff(DIFF_TYPE.UPDATE, oldNode, newNode, [...oldPath, String(j)], [...newPath, String(newIndex)]);
            }
            diffSameLevel(oldNode?.children || [], newNode?.children || [], [...oldPath, String(j), "children"], [...newPath, String(newIndex), "children"]);
            patched++; // 自增已处理的节点数量
          }
        }
        // 处理需要移动的节点
        const increasingNewIndexSequence = moved ? getLIS(newIndexToOldIndexMap) : [];
        let j = increasingNewIndexSequence.length - 1;
        for (let k = toBePatched - 1; k >= 0; k--) {
          const nextIndex = k + s2;
          if (newIndexToOldIndexMap[k] === 0) {
            addDiff(DIFF_TYPE.ADD, undefined, newDataArray[nextIndex], [], [...newPath, String(nextIndex)]);
          } else if (moved) {
            if (j < 0 || k !== increasingNewIndexSequence[j]) {
              addDiff(
                DIFF_TYPE.MOVE,
                oldDataArray[newIndexToOldIndexMap[k] - 1],
                newDataArray[nextIndex],
                [...oldPath, String(newIndexToOldIndexMap[k] - 1)],
                [...newPath, String(nextIndex)]
              );
            } else {
              j--;
            }
          }
        }
      }
    };

    diffSameLevel(toArray(oldData), toArray(newData), [], []);

    return differenceData[mode];
  };

  return {
    diff,
  };
}

const { diff } = useTreeObjectDiff();
export { diff };