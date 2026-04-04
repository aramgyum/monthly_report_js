import { NextResponse } from "next/server";

const PATH = "data/report.json";

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function GET() {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
  const BRANCH = process.env.GITHUB_BRANCH || "main";

  // Not configured — client will fall back to localStorage
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return NextResponse.json({ data: null, configured: false });
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${PATH}?ref=${BRANCH}`,
      { headers: ghHeaders(), cache: "no-store" }
    );

    if (res.status === 404) {
      // File doesn't exist yet — first save will create it
      return NextResponse.json({ data: null, configured: true });
    }

    if (!res.ok) {
      throw new Error(`GitHub API responded ${res.status}`);
    }

    const file = await res.json();
    const data = JSON.parse(
      Buffer.from(file.content, "base64").toString("utf-8")
    );
    return NextResponse.json({ data, configured: true });
  } catch (err) {
    console.error("[load] error:", err.message);
    return NextResponse.json(
      { data: null, error: err.message },
      { status: 500 }
    );
  }
}
