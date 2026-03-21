export async function onRequestPost(context) {
  const { request, env } = context;
  const GITHUB_TOKEN = env.GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    return Response.json({ error: "GitHub token not configured" }, { status: 500 });
  }

  try {
    const { title, content, gistId } = await request.json();
    const gistData = {
      description: title || "md2slides presentation",
      public: false,
      files: {
        "presentation.md": { content },
        "metadata.json": {
          content: JSON.stringify({
            title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        },
      },
    };

    let response;
    let finalGistId = gistId;

    if (gistId) {
      response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: "PATCH",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "md2slides",
        },
        body: JSON.stringify(gistData),
      });

      if (!response.ok) {
        response = await fetch("https://api.github.com/gists", {
          method: "POST",
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            "User-Agent": "md2slides",
          },
          body: JSON.stringify(gistData),
        });
        finalGistId = null;
      }
    } else {
      response = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "md2slides",
        },
        body: JSON.stringify(gistData),
      });
    }

    if (!response.ok) {
      return Response.json({ error: "Failed to save gist" }, { status: response.status });
    }

    const result = await response.json();
    const resultId = finalGistId || result.id;

    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(c => {
        const [key, ...v] = c.trim().split("=");
        return [key, v.join("=")];
      }).filter(([k]) => k)
    );

    const ownedGists = cookies.md2slides_owned
      ? JSON.parse(decodeURIComponent(cookies.md2slides_owned))
      : [];
    if (!ownedGists.includes(resultId)) ownedGists.push(resultId);

    const headers = new Headers({ "Content-Type": "application/json" });
    headers.set(
      "Set-Cookie",
      `md2slides_owned=${encodeURIComponent(JSON.stringify(ownedGists))}; Path=/; Max-Age=31536000; SameSite=Lax`
    );

    return new Response(
      JSON.stringify({ url: result.html_url, id: resultId, updated: !!finalGistId }),
      { headers }
    );
  } catch (error) {
    return Response.json({ error: "Failed to save to gist" }, { status: 500 });
  }
}