import { NextResponse } from "next/server";

const PATH = "data/report.json";

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function POST(req) {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
  const BRANCH = process.env.GITHUB_BRANCH || "main";

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return NextResponse.json(
      { error: "GitHub env vars not configured (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)" },
      { status: 501 }
    );
  }

  try {
    const body = await req.json();

    // 1. Get current file SHA (required for updates, omit for first create)
    let sha;
    const existing = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${PATH}?ref=${BRANCH}`,
      { headers: ghHeaders(), cache: "no-store" }
    );
    if (existing.ok) {
      sha = (await existing.json()).sha;
    }

    // 2. Encode content as base64
    const encoded = Buffer.from(
      JSON.stringify(body, null, 2),
      "utf-8"
    ).toString("base64");

    // 3. PUT file to GitHub
    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${PATH}`,
      {
        method: "PUT",
        headers: ghHeaders(),
        body: JSON.stringify({
          message: "report: update monthly data",
          content: encoded,
          branch: BRANCH,
          ...(sha && { sha }),
        }),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || `GitHub PUT failed: ${putRes.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[save] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
