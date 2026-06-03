import { describe, expect, test } from "bun:test";
import { DuplicateProviderError } from "../registry";
import {
	CircularDependencyError,
	InvalidDependencyError,
	MissingProviderError,
} from "../resolver";
import { DiError } from ".";

describe("DiError", () => {
	test("is an Error", () => {
		expect(new DiError("message")).toBeInstanceOf(Error);
	});

	test.each([
		["MissingProviderError", new MissingProviderError("TOKEN")],
		["InvalidDependencyError", new InvalidDependencyError("dep")],
		["CircularDependencyError", new CircularDependencyError(["A", "B"])],
		["DuplicateProviderError", new DuplicateProviderError("TOKEN")],
	])("%s extends DiError", (name, error) => {
		expect(error).toBeInstanceOf(DiError);
		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe(name);
	});
});
