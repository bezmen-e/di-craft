import {
	createContainer,
	createToken,
	type Provider,
	provideFactory,
	provideValue,
} from "di-craft";

type Config = {
	readonly logPrefix: string;
};

class Logger {
	private readonly prefix: string;

	constructor(prefix: string) {
		this.prefix = prefix;
	}

	info(message: string): string {
		return `${this.prefix}: ${message}`;
	}
}

class UserService {
	private readonly logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	list(): readonly string[] {
		this.logger.info("list users");
		return ["Ada", "Grace"];
	}
}

const CONFIG = createToken<Config>("CONFIG");
const LOGGER = createToken<Logger>("LOGGER");
const USERS = createToken<UserService>("USERS");

const providers: readonly Provider[] = [
	provideValue(CONFIG, { logPrefix: "users" }),
	provideFactory(LOGGER, {
		deps: { config: CONFIG },
		useFactory: ({ config }) => new Logger(config.logPrefix),
	}),
	provideFactory(USERS, {
		deps: { logger: LOGGER },
		useFactory: ({ logger }) => new UserService(logger),
	}),
];

const container = createContainer(providers);
const users = container.get(USERS);

users.list();
