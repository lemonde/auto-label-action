import * as core from "@actions/core";
import * as github from "@actions/github";
import { readFile } from "node:fs/promises";

/**
 * @param {{ types: Record<string, string> }} config
 * @param {{ commit: { message: string }}[]} commits
 */
const getActiveLabels = (config, commits) => {
  const types = Object.entries(config.types).map(([label, value]) => ({
    label,
    regexp: new RegExp(value),
  }));

  return commits.reduce((labels, commit) => {
    /**
     * @param {string} label
     */
    const addLabel = (label) => {
      if (!labels.includes(label)) {
        labels.push(label);
      }
    };

    types.forEach((type) => {
      if (type.regexp.test(commit.commit.message)) {
        addLabel(type.label);
      }
    });

    return labels;
  }, /** @type {string[]} */ ([]));
};

const readConfig = async () => {
  const config = await readFile(".github/auto-label.json", "utf-8");
  return JSON.parse(config);
};

async function run() {
  /** @type {string} */
  const token = core.getInput("token");
  const octokit = github.getOctokit(token);
  const pull_number = github.context.payload.pull_request.number;
  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;

  const [config, { data: pull }, { data: commits }] = await Promise.all([
    readConfig(),
    octokit.rest.pulls.get({
      owner,
      repo,
      pull_number,
    }),
    octokit.rest.pulls.listCommits({
      owner,
      repo,
      pull_number,
    }),
  ]);
  const activeLabels = getActiveLabels(config, commits);
  const oldLabels = pull.labels.map((label) => label.name);
  const upToDate = activeLabels.every((label) => oldLabels.includes(label));
  if (upToDate) return;
  const newLabels = Array.from(new Set([...oldLabels, ...activeLabels]));
  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: pull_number,
    labels: newLabels,
  });
}

try {
  await run();
} catch (error) {
  core.setFailed(error.message);
}
