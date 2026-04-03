import OpenAI, { AzureOpenAI } from "openai";

// ─── Detect which provider is available ─────────────────────────
const hasOpenAIKey = Boolean(
  process.env.OPENAI_API_KEY?.trim() &&
  process.env.OPENAI_API_KEY !== "sk-your_openai_api_key"
);

const hasAzureKeys = Boolean(
  process.env.AZURE_OPENAI_KEY?.trim() &&
  process.env.AZURE_OPENAI_ENDPOINT?.trim()
);

/** Which provider is active */
export const aiProvider: "openai" | "azure" | "none" = hasOpenAIKey
  ? "openai"
  : hasAzureKeys
    ? "azure"
    : "none";

/** Whether any AI provider is configured */
export const isAIConfigured = aiProvider !== "none";

// ─── Parse Azure endpoint ───────────────────────────────────────
// The env var may be a full URL like:
//   https://seekh.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-01
// We extract: base endpoint, deployment name, and api-version.

function parseAzureEndpoint(raw: string) {
  const url = new URL(raw);
  const base = `${url.protocol}//${url.host}`;
  const apiVersion = url.searchParams.get("api-version") || "2024-02-01";

  // Extract deployment name from path: /openai/deployments/<name>/...
  const match = url.pathname.match(/\/openai\/deployments\/([^/]+)/);
  const deployment = match?.[1] || "gpt-4o";

  return { base, apiVersion, deployment };
}

// ─── Build the client ───────────────────────────────────────────
let openai: OpenAI;
let azureDeployment: string | undefined;

if (aiProvider === "azure") {
  const { base, apiVersion, deployment } = parseAzureEndpoint(
    process.env.AZURE_OPENAI_ENDPOINT!
  );
  azureDeployment = deployment;

  openai = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_KEY!,
    endpoint: base,
    apiVersion,
    deployment,
  });

  console.log(
    `[openai] Using Azure OpenAI — endpoint=${base}, deployment=${deployment}, api-version=${apiVersion}`
  );
} else {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  if (hasOpenAIKey) {
    console.log("[openai] Using OpenAI API");
  } else {
    console.log("[openai] No AI provider configured — will use demo data");
  }
}

export { openai, azureDeployment };
