import { itemAt } from "../invariant.ts";
import * as awilix from "./awilix.ts";
import * as diCraft from "./di-craft.ts";
import * as inversify from "./inversify.ts";
import { SUBJECT_NAMES } from "./subject-names.ts";
import * as tsyringe from "./tsyringe.ts";
import * as typedInject from "./typed-inject.ts";
import * as typedi from "./typedi.ts";
import type { Subject } from "./types.ts";

export const subjects: readonly Subject[] = [
	{ name: SUBJECT_NAMES.diCraft, build: diCraft.buildRoot },
	{ name: SUBJECT_NAMES.inversify, build: inversify.buildRoot },
	{ name: SUBJECT_NAMES.awilixProxy, build: awilix.buildRootProxy },
	{ name: SUBJECT_NAMES.awilixClassic, build: awilix.buildRootClassic },
	{ name: SUBJECT_NAMES.tSyringe, build: tsyringe.buildRoot },
	{ name: SUBJECT_NAMES.typeDi, build: typedi.buildRoot },
	{ name: SUBJECT_NAMES.typedInject, build: typedInject.buildRoot },
];

const balancedPositions = subjects.map((_, position) => {
	if (position === 0) return 0;
	return position % 2 === 1
		? (position + 1) / 2
		: subjects.length - position / 2;
});

export function balancedBlockSize(subjectCount = subjects.length): number {
	return subjectCount % 2 === 0 ? subjectCount : subjectCount * 2;
}

export function orderSubjects(round: number): readonly Subject[] {
	if (!Number.isInteger(round) || round < 1) {
		throw new Error("round must be a positive integer");
	}

	const offset = (round - 1) % subjects.length;
	const blockRow = Math.floor((round - 1) / subjects.length);
	const ordered = balancedPositions.map((position) =>
		itemAt(subjects, (position + offset) % subjects.length),
	);

	return subjects.length % 2 === 1 && blockRow % 2 === 1
		? ordered.reverse()
		: ordered;
}
