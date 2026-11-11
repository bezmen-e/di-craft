// Stages the library package for npm trusted publishing, but only when the
// current commit is a Changesets version merge (it deletes the consumed
// changeset files). Every other push to main skips silently, so the Release
// workflow stays green between releases.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const packageDir = fileURLToPath(new URL("packages/di-craft/", root));
const manifest = JSON.parse(
	readFileSync(new URL("package.json", packageDir), "utf8"),
);

const consumedChangesets = execSync(
	"git diff --name-status HEAD^1 HEAD -- .changeset",
	{ cwd: fileURLToPath(root), encoding: "utf8" },
)
	.split("\n")
	.some((line) => line.startsWith("D\t.changeset/"));

if (!consumedChangesets) {
	console.log(
		`No changesets were consumed by ${execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim()}; skipping the npm stage for ${manifest.name}@${manifest.version}.`,
	);
	process.exit(0);
}

execSync("npm stage publish --ignore-scripts", {
	cwd: packageDir,
	stdio: "inherit",
});
