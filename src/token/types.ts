export type Token<T> = {
	readonly id: symbol;
	readonly name: string;

	readonly __type?: T;
};
