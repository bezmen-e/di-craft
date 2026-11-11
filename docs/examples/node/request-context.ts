import { createToken, provideFactory, provideValue } from "di-craft";
import { createNodeDi } from "di-craft/node";

type Audience = "human" | "crawler" | "preview";

class TimelineService {
	list(): readonly string[] {
		return ["post-1", "post-2"];
	}
}

const TIMELINE_SERVICE = createToken<TimelineService>("TIMELINE_SERVICE");
const PAGE_TITLE = createToken<string>("PAGE_TITLE");

const di = createNodeDi<Audience>({
	requestProviders: (context) =>
		context === "preview"
			? // Link-preview bots read head tags only, so the preview scope
				// never registers the timeline service and it is never created.
				[provideValue(PAGE_TITLE, "Profile")]
			: [
					provideValue(PAGE_TITLE, "Profile"),
					provideFactory(TIMELINE_SERVICE, {
						useFactory: () => new TimelineService(),
					}),
				],
});

// The application middleware decides the audience; di-craft only carries the
// value into requestProviders.
const render = (audience: Audience) =>
	di.runWithRequestContainer({
		context: audience,
		run: async (container) => {
			const title = container.get(PAGE_TITLE);
			const posts = container.has(TIMELINE_SERVICE)
				? container.get(TIMELINE_SERVICE).list()
				: [];

			return { title, posts };
		},
	});

await render("human");
await render("preview");
