import { redValues } from "./RouletteNumber";

export type RouletteTag =
  | "green"
  | "red"
  | "black"
  | "even"
  | "odd"
  | "column1"
  | "column2"
  | "column3"
  | "dozen1"
  | "dozen2"
  | "dozen3"
  | "row1"
  | "row2"
  | "row3"
  | "low"
  | "high";

export type RouletteResult = {
  number: number;
  tags: RouletteTag[];
};

export function RouletteGen(number: number): RouletteResult {
  const result: RouletteResult = {
    number,
    tags: [],
  };

  if (number === 0) {
    result.tags.push("green");
    return result;
  }

  result.tags.push(redValues.has(number) ? "red" : "black");
  result.tags.push(number % 2 === 0 ? "even" : "odd");

  if (number % 3 === 2) result.tags.push("row1");
  if (number % 3 === 1) result.tags.push("row2");
  if (number % 3 === 0) result.tags.push("row3");

  if (0 < number && number <= 12) result.tags.push("column1");
  else if (12 < number && number <= 24) result.tags.push("column2");
  else if (24 < number && number <= 36) result.tags.push("column3");

  if (number <= 12) result.tags.push("dozen1");
  else if (number <= 24) result.tags.push("dozen2");
  else result.tags.push("dozen3");

  result.tags.push(number <= 18 ? "low" : "high");

  return result;
}
