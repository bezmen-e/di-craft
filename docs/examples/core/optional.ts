import {
	createContainer,
	createToken,
	optional,
	provideFactory,
	provideValue,
} from "di-craft";

class Logger {
	info(message: string): string {
		return message;
	}
}

class UserService {
	private readonly logger: Logger | undefined;

	constructor(logger: Logger | undefined) {
		this.logger = logger;
	}

	list(): readonly string[] {
		this.logger?.info("list users");
		return ["Ada", "Grace"];
	}
}

const LOGGER = createToken<Logger>("LOGGER");
const USERS = createToken<UserService>("USERS");

const container = createContainer([
	provideFactory(USERS, {
		deps: { logger: optional(LOGGER) },
		useFactory: ({ logger }) => new UserService(logger),
	}),
]);

const users = container.get(USERS);
const logger = container.get(optional(LOGGER));

users.list();
logger?.info("optional logger is registered");

const containerWithLogger = createContainer([
	provideValue(LOGGER, new Logger()),
	provideFactory(USERS, {
		deps: { logger: optional(LOGGER) },
		useFactory: ({ logger }) => new UserService(logger),
	}),
]);

containerWithLogger.get(USERS).list();
