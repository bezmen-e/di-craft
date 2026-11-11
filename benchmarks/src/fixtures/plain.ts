export class Logger {
	log(_message: string): void {}
}

export class Config {
	readonly url = "postgres://localhost/app";
}

export class Repo {
	constructor(
		public readonly logger: Logger,
		public readonly config: Config,
	) {}
}

export class Service {
	constructor(
		public readonly repo: Repo,
		public readonly logger: Logger,
	) {}
}

export class TransientService {
	constructor(
		public readonly repo: Repo,
		public readonly logger: Logger,
	) {}
}

export class ScopedService {
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

	destroy(): void {
		this.disposeCount += 1;
	}
}

export class Wide4 {
	constructor(
		public readonly logger: Logger,
		public readonly config: Config,
		public readonly repo: Repo,
		public readonly service: Service,
	) {}
}

export class Dep0 {}
export class Dep1 {}
export class Dep2 {}
export class Dep3 {}
export class Dep4 {}
export class Dep5 {}
export class Dep6 {}
export class Dep7 {}
export class Dep8 {}
export class Dep9 {}

export class Wide10 {
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

export class L0 {}
export class L1 {
	constructor(public readonly l0: L0) {}
}
export class L2 {
	constructor(public readonly l1: L1) {}
}
export class L3 {
	constructor(public readonly l2: L2) {}
}
export class L4 {
	constructor(public readonly l3: L3) {}
}
export class L5 {
	constructor(public readonly l4: L4) {}
}
export class L6 {
	constructor(public readonly l5: L5) {}
}
export class L7 {
	constructor(public readonly l6: L6) {}
}
export class L8 {
	constructor(public readonly l7: L7) {}
}
export class L9 {
	constructor(public readonly l8: L8) {}
}
