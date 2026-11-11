import {
	Config as PlainConfig,
	Dep0 as PlainDep0,
	Dep1 as PlainDep1,
	Dep2 as PlainDep2,
	Dep3 as PlainDep3,
	Dep4 as PlainDep4,
	Dep5 as PlainDep5,
	Dep6 as PlainDep6,
	Dep7 as PlainDep7,
	Dep8 as PlainDep8,
	Dep9 as PlainDep9,
	L0 as PlainL0,
	Logger as PlainLogger,
} from "./plain.ts";

export class Logger extends PlainLogger {}
export class Config extends PlainConfig {}

export class Repo {
	static readonly inject = ["logger", "config"] as const;

	constructor(
		public readonly logger: Logger,
		public readonly config: Config,
	) {}
}

export class Service {
	static readonly inject = ["repo", "logger"] as const;

	constructor(
		public readonly repo: Repo,
		public readonly logger: Logger,
	) {}
}

export class TransientService {
	static readonly inject = ["repo", "logger"] as const;

	constructor(
		public readonly repo: Repo,
		public readonly logger: Logger,
	) {}
}

export class ScopedService {
	static readonly inject = ["logger"] as const;
	disposeCount = 0;

	constructor(public readonly logger: Logger) {}

	[Symbol.dispose](): void {
		this.disposeCount += 1;
	}

	async [Symbol.asyncDispose](): Promise<void> {
		this.disposeCount += 1;
	}

	async dispose(): Promise<void> {
		this.disposeCount += 1;
	}
}

export class Wide4 {
	static readonly inject = ["logger", "config", "repo", "service"] as const;

	constructor(
		public readonly logger: Logger,
		public readonly config: Config,
		public readonly repo: Repo,
		public readonly service: Service,
	) {}
}

export class Dep0 extends PlainDep0 {}
export class Dep1 extends PlainDep1 {}
export class Dep2 extends PlainDep2 {}
export class Dep3 extends PlainDep3 {}
export class Dep4 extends PlainDep4 {}
export class Dep5 extends PlainDep5 {}
export class Dep6 extends PlainDep6 {}
export class Dep7 extends PlainDep7 {}
export class Dep8 extends PlainDep8 {}
export class Dep9 extends PlainDep9 {}

export class Wide10 {
	static readonly inject = [
		"dep0",
		"dep1",
		"dep2",
		"dep3",
		"dep4",
		"dep5",
		"dep6",
		"dep7",
		"dep8",
		"dep9",
	] as const;

	constructor(
		public readonly dep0: Dep0,
		public readonly dep1: Dep1,
		public readonly dep2: Dep2,
		public readonly dep3: Dep3,
		public readonly dep4: Dep4,
		public readonly dep5: Dep5,
		public readonly dep6: Dep6,
		public readonly dep7: Dep7,
		public readonly dep8: Dep8,
		public readonly dep9: Dep9,
	) {}
}

export class L0 extends PlainL0 {}
export class L1 {
	static readonly inject = ["l0"] as const;
	constructor(public readonly l0: L0) {}
}
export class L2 {
	static readonly inject = ["l1"] as const;
	constructor(public readonly l1: L1) {}
}
export class L3 {
	static readonly inject = ["l2"] as const;
	constructor(public readonly l2: L2) {}
}
export class L4 {
	static readonly inject = ["l3"] as const;
	constructor(public readonly l3: L3) {}
}
export class L5 {
	static readonly inject = ["l4"] as const;
	constructor(public readonly l4: L4) {}
}
export class L6 {
	static readonly inject = ["l5"] as const;
	constructor(public readonly l5: L5) {}
}
export class L7 {
	static readonly inject = ["l6"] as const;
	constructor(public readonly l6: L6) {}
}
export class L8 {
	static readonly inject = ["l7"] as const;
	constructor(public readonly l7: L7) {}
}
export class L9 {
	static readonly inject = ["l8"] as const;
	constructor(public readonly l8: L8) {}
}
