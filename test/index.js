import test from "node:test";
import assert from "node:assert";
import { diff } from "../dist/index.esm.js";

const oldTree = [
  {
    id: 1,
    value: 1,
    children: [
      { id: 11, value: 11 },
      { id: 12, value: 12 },
    ],
  },
  {
    id: 2,
    value: 2,
    children: [
      { id: 21, value: 21 },
      { id: 22, value: 22 },
    ],
  },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  {
    id: 5,
    value: 5,
    children: [
      { id: 51, value: 51 },
      { id: 52, value: 52 },
    ],
  },
  { id: 6, value: 6 },
];

const newAddTree = [
  {
    id: 1,
    value: 1,
    children: [
      { id: 11, value: 11 },
      { id: 12, value: 12 },
    ],
  },
  { id: 7, value: 7 },
  {
    id: 2,
    value: 2,
    children: [
      { id: 21, value: 21 },
      { id: 22, value: 22 },
      { id: 23, value: 23 },
    ],
  },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  {
    id: 5,
    value: 5,
    children: [
      { id: 51, value: 51 },
      { id: 52, value: 52 },
    ],
  },
  { id: 6, value: 6 },
];

const newDeleteTree = [
  {
    id: 1,
    value: 1,
    children: [
      { id: 11, value: 11 },
      { id: 12, value: 12 },
    ],
  },
  { id: 2, value: 2 },
  { id: 3, value: 3 },
  {
    id: 5,
    value: 5,
    children: [
      { id: 51, value: 51 },
      { id: 52, value: 52 },
    ],
  },
];

const newUpdateTree = [
  {
    id: 1,
    value: 11,
    children: [
      { id: 11, value: 11 },
      { id: 12, value: 12 },
    ],
  },
  {
    id: 2,
    value: 2,
    children: [
      { id: 21, value: 21 },
      { id: 22, value: 222 },
    ],
  },
  { id: 3, value: 3 },
  { id: 4, value: 44 },
  {
    id: 5,
    value: 5,
    children: [
      { id: 51, value: 51 },
      { id: 52, value: 52 },
    ],
  },
  { id: 6, value: 6 },
];

const newSameLevelMoveTree = [
  {
    id: 1,
    value: 1,
    children: [
      { id: 11, value: 11 },
      { id: 12, value: 12 },
    ],
  },
  { id: 4, value: 4 },
  {
    id: 2,
    value: 2,
    children: [
      { id: 22, value: 22 },
      { id: 21, value: 21 },
    ],
  },
  { id: 3, value: 3 },
  { id: 6, value: 6 },
  {
    id: 5,
    value: 5,
    children: [
      { id: 51, value: 51 },
      { id: 52, value: 52 },
    ],
  },
];

const newDifferentLevelMoveTree = [
  {
    id: 1,
    value: 1,
    children: [
      { id: 11, value: 11 },
      { id: 12, value: 12 },
    ],
  },
  {
    id: 2,
    value: 2,
    children: [{ id: 21, value: 21 }],
  },
  { id: 22, value: 22 },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  {
    id: 5,
    value: 5,
    children: [
      { id: 51, value: 51 },
      { id: 52, value: 52 },
      { id: 6, value: 6 },
    ],
  },
];

const newMultipleTree = [
  {
    id: 1,
    value: 1,
    children: [
      { id: 11, value: 11 },
      { id: 12, value: 12 },
    ],
  },
  { id: 3, value: 3 },
  {
    id: 2,
    value: 2,
    children: [
      { id: 21, value: 21 },
      { id: 22, value: 2233 },
      { id: 4, value: 4 },
    ],
  },
  { id: 7, value: 7 },
  {
    id: 5,
    value: 5566,
    children: [{ id: 52, value: 52 }],
  },
  { id: 6, value: 6 },
];

test("add node", () => {
  assert.deepStrictEqual(diff(oldTree, newAddTree), {
    ADD: [
      { newNode: { id: 23, value: 23 }, newPath: ["2", "children", "2"], oldNode: undefined, oldPath: [] },
      { newNode: { id: 7, value: 7 }, newPath: ["1"], oldNode: undefined, oldPath: [] },
    ],
    DELETE: [],
    UPDATE: [],
    MOVE: [],
  });
});

test("delete node", () => {
  assert.deepStrictEqual(diff(oldTree, newDeleteTree), {
    ADD: [],
    DELETE: [
      { oldNode: { id: 21, value: 21 }, oldPath: ["1", "children", "0"], newNode: undefined, newPath: [] },
      { oldNode: { id: 22, value: 22 }, oldPath: ["1", "children", "1"], newNode: undefined, newPath: [] },
      { oldNode: { id: 4, value: 4 }, oldPath: ["3"], newNode: undefined, newPath: [] },
      { oldNode: { id: 6, value: 6 }, oldPath: ["5"], newNode: undefined, newPath: [] },
    ],
    UPDATE: [],
    MOVE: [],
  });
});

test("update node", () => {
  assert.deepStrictEqual(diff(oldTree, newUpdateTree), {
    ADD: [],
    DELETE: [],
    UPDATE: [
      { oldNode: { id: 1, value: 1 }, newNode: { id: 1, value: 11 }, oldPath: ["0"], newPath: ["0"] },
      { oldNode: { id: 22, value: 22 }, newNode: { id: 22, value: 222 }, oldPath: ["1", "children", "1"], newPath: ["1", "children", "1"] },
      { oldNode: { id: 4, value: 4 }, newNode: { id: 4, value: 44 }, oldPath: ["3"], newPath: ["3"] },
    ],
    MOVE: [],
  });
});

test("same level move node", () => {
  assert.deepStrictEqual(diff(oldTree, newSameLevelMoveTree), {
    ADD: [],
    DELETE: [],
    UPDATE: [],
    MOVE: [
      { oldNode: { id: 22, value: 22 }, newNode: { id: 22, value: 22 }, oldPath: ["1", "children", "1"], newPath: ["2", "children", "0"] },
      { oldNode: { id: 5, value: 5 }, newNode: { id: 5, value: 5 }, oldPath: ["4"], newPath: ["5"] },
      { oldNode: { id: 4, value: 4 }, newNode: { id: 4, value: 4 }, oldPath: ["3"], newPath: ["1"] },
    ],
  });
});

test("different level move node", () => {
  assert.deepStrictEqual(diff(oldTree, newDifferentLevelMoveTree), {
    ADD: [
      { oldNode: undefined, newNode: { id: 6, value: 6 }, oldPath: [], newPath: ["5", "children", "2"] },
      { oldNode: undefined, newNode: { id: 22, value: 22 }, oldPath: [], newPath: ["2"] },
    ],
    DELETE: [
      { oldNode: { id: 22, value: 22 }, oldPath: ["1", "children", "1"], newNode: undefined, newPath: [] },
      { oldNode: { id: 6, value: 6 }, oldPath: ["5"], newNode: undefined, newPath: [] },
    ],
    UPDATE: [],
    MOVE: [],
  });
});

test("multiple changes", () => {
  assert.deepStrictEqual(diff(oldTree, newMultipleTree), {
    ADD: [
      { newNode: { id: 4, value: 4 }, oldPath: [], newPath: ["2", "children", "2"], oldNode: undefined },
      { newNode: { id: 7, value: 7 }, oldPath: [], newPath: ["3"], oldNode: undefined },
    ],
    DELETE: [
      { oldNode: { id: 51, value: 51 }, oldPath: ["4", "children", "0"], newNode: undefined, newPath: [] },
      { oldNode: { id: 4, value: 4 }, oldPath: ["3"], newNode: undefined, newPath: [] },
    ],
    UPDATE: [
      { oldNode: { id: 5, value: 5 }, newNode: { id: 5, value: 5566 }, oldPath: ["4"], newPath: ["4"] },
      { oldNode: { id: 22, value: 22 }, newNode: { id: 22, value: 2233 }, oldPath: ["1", "children", "1"], newPath: ["2", "children", "1"] },
    ],
    MOVE: [{ oldNode: { id: 3, value: 3 }, newNode: { id: 3, value: 3 }, oldPath: ["2"], newPath: ["1"] }],
  });
});
