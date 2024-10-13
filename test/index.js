import test from "node:test";
import assert from "node:assert";
import { diff } from "../dist/index.esm.js";

const oldTree = {
  id: "root",
  value: "root",
  children: [
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
  ],
};

const newTree = {
  id: "root",
  value: "root",
  children: [
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
  ],
};

test("diff", () => {
  assert.deepStrictEqual(diff(oldTree, newTree), [
    {
      id: "root",
      change: ["unchanged"],
      detail: {
        newPath: [],
        newValue: { value: "root" },
        oldPath: [],
        oldValue: { value: "root" },
      },
      children: [
        {
          id: 1,
          change: ["unchanged"],
          detail: {
            newValue: { value: 1 },
            newPath: ["children", "0"],
            oldValue: { value: 1 },
            oldPath: ["children", "0"],
          },
          children: [
            {
              id: 11,
              change: ["unchanged"],
              detail: {
                newValue: { value: 11 },
                newPath: ["children", "0", "children", "0"],
                oldValue: { value: 11 },
                oldPath: ["children", "0", "children", "0"],
              },
              children: [],
            },
            {
              id: 12,
              change: ["unchanged"],
              detail: {
                newValue: { value: 12 },
                newPath: ["children", "0", "children", "1"],
                oldValue: { value: 12 },
                oldPath: ["children", "0", "children", "1"],
              },
              children: [],
            },
          ],
        },
        {
          id: 3,
          change: ["moved"],
          detail: {
            newValue: { value: 3 },
            newPath: ["children", "1"],
            oldValue: { value: 3 },
            oldPath: ["children", "2"],
          },
          children: [],
        },
        {
          id: 2,
          change: ["unchanged"],
          detail: {
            newValue: { value: 2 },
            newPath: ["children", "2"],
            oldValue: { value: 2 },
            oldPath: ["children", "1"],
          },
          children: [
            {
              id: 21,
              change: ["unchanged"],
              detail: {
                newValue: { value: 21 },
                newPath: ["children", "2", "children", "0"],
                oldValue: { value: 21 },
                oldPath: ["children", "1", "children", "0"],
              },
              children: [],
            },
            {
              id: 22,
              change: ["updated"],
              detail: {
                newValue: { value: 2233 },
                newPath: ["children", "2", "children", "1"],
                oldValue: { value: 22 },
                oldPath: ["children", "1", "children", "1"],
              },
              children: [],
            },
            {
              id: 4,
              change: ["moved"],
              detail: {
                newValue: { value: 4 },
                newPath: ["children", "2", "children", "2"],
                oldValue: { value: 4 },
                oldPath: ["children", "3"],
              },
              children: [],
            },
          ],
        },
        {
          id: 7,
          change: ["added"],
          detail: {
            newValue: { value: 7 },
            newPath: ["children", "3"],
            oldValue: undefined,
            oldPath: undefined,
          },
          children: [],
        },
        {
          id: 5,
          change: ["updated"],
          detail: {
            newValue: { value: 5566 },
            newPath: ["children", "4"],
            oldValue: { value: 5 },
            oldPath: ["children", "4"],
          },
          children: [
            {
              id: 51,
              change: ["deleted"],
              detail: {
                newValue: undefined,
                newPath: undefined,
                oldValue: { value: 51 },
                oldPath: ["children", "4", "children", "0"],
              },
              children: [],
            },
            {
              id: 52,
              change: ["unchanged"],
              detail: {
                newValue: { value: 52 },
                newPath: ["children", "4", "children", "0"],
                oldValue: { value: 52 },
                oldPath: ["children", "4", "children", "1"],
              },
              children: [],
            },
          ],
        },
        {
          id: 6,
          change: ["unchanged"],
          detail: {
            newValue: { value: 6 },
            newPath: ["children", "5"],
            oldValue: { value: 6 },
            oldPath: ["children", "5"],
          },
          children: [],
        },
      ],
    },
  ]);
});
