export async function onRequestGet(context) {
  const { request, env, params } = context;
  const GITHUB_TOKEN = env.GITHUB_TOKEN;
  const gistId = params.id;

  if (!GITHUB_TOKEN) {
    return Response.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "User-Agent": "md2slides",
      },
    });

    if (!response.ok) {
      return Response.json(
        { error: "Gist not found" },
        { status: response.status }
      );
    }

    const gist = await response.json();
    const content = gist.files["presentation.md"]?.content || "";
    let title = "Untitled Presentation";

    if (gist.files["metadata.json"]) {
      try {
        const metadata = JSON.parse(gist.files["metadata.json"].content);
        title = metadata.title || title;
      } catch (e) {
      }
    }

    return Response.json({ content, title });
  } catch (error) {
    return Response.json(
      { error: "Failed to load from gist" },
      { status: 500 }
    );
  }
}