import "reflect-metadata";
import { Inject, Service as RegisterService } from "typedi";
import * as F from "./plain.ts";

export const ROOT_LOGGER_TOKEN = "typedi.rootLogger";

// biome-ignore lint/suspicious/noExplicitAny: TypeDI metadata accepts constructors with arbitrary parameters.
type Constructor = new (...args: any[]) => object;

function service(
	target: Constructor,
	dependencies: readonly Constructor[],
	transient = false,
): void {
	Reflect.defineMetadata("design:paramtypes", dependencies, target);
	RegisterService({ transient })(target);
}

service(F.Logger, []);
service(F.Config, []);
service(F.Repo, [F.Logger, F.Config]);
service(F.Service, [F.Repo, F.Logger]);
service(F.TransientService, [F.Repo, F.Logger], true);
service(F.Wide4, [F.Logger, F.Config, F.Repo, F.Service], true);
service(F.Dep0, []);
service(F.Dep1, []);
service(F.Dep2, []);
service(F.Dep3, []);
service(F.Dep4, []);
service(F.Dep5, []);
service(F.Dep6, []);
service(F.Dep7, []);
service(F.Dep8, []);
service(F.Dep9, []);
service(
	F.Wide10,
	[
		F.Dep0,
		F.Dep1,
		F.Dep2,
		F.Dep3,
		F.Dep4,
		F.Dep5,
		F.Dep6,
		F.Dep7,
		F.Dep8,
		F.Dep9,
	],
	true,
);
service(F.L0, [], true);
service(F.L1, [F.L0], true);
service(F.L2, [F.L1], true);
service(F.L3, [F.L2], true);
service(F.L4, [F.L3], true);
service(F.L5, [F.L4], true);
service(F.L6, [F.L5], true);
service(F.L7, [F.L6], true);
service(F.L8, [F.L7], true);
service(F.L9, [F.L8], true);

Reflect.defineMetadata("design:paramtypes", [F.Logger], F.ScopedService);
Inject(ROOT_LOGGER_TOKEN)(F.ScopedService, undefined, 0);

export {
	Config,
	L9,
	Logger,
	Repo,
	ScopedService,
	Service,
	TransientService,
	Wide4,
	Wide10,
} from "./plain.ts";
