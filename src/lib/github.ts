interface CreateRepoInput {
  ideaId: string;
  ideaTitle: string;
  ideaDescription: string;
}

interface CreateRepoResult {
  name: string;
  htmlUrl: string;
}

function slugifyRepoName(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "project";
}

function githubConfig() {
  const token = process.env.GITHUB_ORG_TOKEN?.trim();
  const org = process.env.GITHUB_ORG_NAME?.trim() || "NextUpDesign";
  return { token, org };
}

export async function createOrgRepoForIdea(
  input: CreateRepoInput
): Promise<CreateRepoResult | null> {
  const { token, org } = githubConfig();
  if (!token || !org) return null;

  const baseName = `${slugifyRepoName(input.ideaTitle)}-${input.ideaId.slice(0, 6)}`;
  const description = `Auto-generated from NextUp idea ${input.ideaId}: ${input.ideaDescription.slice(
    0,
    180
  )}`;

  const response = await fetch("https://api.github.com/orgs/" + org + "/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      name: baseName,
      description,
      private: true,
      has_issues: true,
      has_wiki: false,
      auto_init: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub repo creation failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { name: string; html_url: string };
  return { name: data.name, htmlUrl: data.html_url };
}
