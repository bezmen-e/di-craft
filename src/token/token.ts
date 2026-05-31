import type { Token } from "./types.ts";

class TokenClass<T> implements Token<T> {
  readonly name: string;
  readonly id: symbol;

  declare readonly __type?: T;

  constructor(name: string) {
    this.name = name;
    this.id = Symbol(name);
  }
}

export const createToken = <T>(name: string): Token<T> =>
  new TokenClass<T>(name);
