import { createContainer, createToken, provideFactory } from "di-craft";

class Connection {
	private closed = false;

	query(): string {
		return this.closed ? "closed" : "open";
	}

	close(): void {
		this.closed = true;
	}
}

const CONNECTION = createToken<Connection>("CONNECTION");

const container = createContainer([
	provideFactory(CONNECTION, {
		useFactory: () => new Connection(),
		onDispose: (connection) => {
			connection.close();
		},
	}),
]);

const connection = container.get(CONNECTION);

connection.query();

await container.dispose();
