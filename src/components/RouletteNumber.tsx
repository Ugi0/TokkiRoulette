export type RouletteColor = "red" | "black" | "green";

export type RouletteNumber = {
  value: number;
  color: RouletteColor;
};

export const redValues = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export const zero: RouletteNumber = { value: 0, color: "green" };

export const numbers: RouletteNumber[] = [
  { value: 3, color: "red" },
  { value: 6, color: "black" },
  { value: 9, color: "red" },
  { value: 12, color: "red" },
  { value: 15, color: "black" },
  { value: 18, color: "red" },
  { value: 21, color: "red" },
  { value: 24, color: "black" },
  { value: 27, color: "red" },
  { value: 30, color: "red" },
  { value: 33, color: "black" },
  { value: 36, color: "red" },

  { value: 2, color: "black" },
  { value: 5, color: "red" },
  { value: 8, color: "black" },
  { value: 11, color: "black" },
  { value: 14, color: "red" },
  { value: 17, color: "black" },
  { value: 20, color: "black" },
  { value: 23, color: "red" },
  { value: 26, color: "black" },
  { value: 29, color: "black" },
  { value: 32, color: "red" },
  { value: 35, color: "black" },

  { value: 1, color: "red" },
  { value: 4, color: "black" },
  { value: 7, color: "red" },
  { value: 10, color: "black" },
  { value: 13, color: "black" },
  { value: 16, color: "red" },
  { value: 19, color: "red" },
  { value: 22, color: "black" },
  { value: 25, color: "red" },
  { value: 28, color: "black" },
  { value: 31, color: "black" },
  { value: 34, color: "red" },
];

export const numberColorMap = new Map(
  [zero, ...numbers].map((entry) => [entry.value, entry.color])
);
