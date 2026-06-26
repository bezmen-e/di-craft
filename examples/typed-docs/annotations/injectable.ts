import {
	createContainer,
	createToken,
	Injectable,
	optional,
	provideInjectable,
	provideValue,
	Scopes,
} from "di-craft";

type Config = {
	readonly debug: boolean;
};

class Logger {
	info(message: string): string {
		return message;
	}
}

const CONFIG = createToken<Config>("CONFIG");
const LOGGER = createToken<Logger>("LOGGER");
const USERS = createToken<UserService>("USERS");

@Injectable({
	token: USERS,
	deps: [LOGGER, optional(CONFIG)],
	scope: Scopes.Scoped,
})
class UserService {
	private readonly logger: Logger;
	private readonly config: Config | undefined;

	constructor(logger: Logger, config: Config | undefined) {
		this.logger = logger;
		this.config = config;
	}

	list(): readonly string[] {
		this.logger.info("list users");
		return this.config?.debug ? ["Ada", "Grace", "debug"] : ["Ada", "Grace"];
	}
}

const container = createContainer([
	provideValue(LOGGER, new Logger()),
	provideInjectable(UserService),
]);

container.get(USERS).list();
