export async function onRequestDelete(context) {
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
      method: "DELETE",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "User-Agent": "md2slides",
      },
    });

    if (!response.ok && response.status !== 404) {
      return Response.json(
        { error: "Failed to delete gist" },
        { status: response.status }
      );
    }

    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(c => {
        const [key, ...v] = c.trim().split("=");
        return [key, v.join("=")];
      }).filter(([k]) => k)
    );
    
    const ownedGists = cookies.md2slides_owned ? JSON.parse(decodeURIComponent(cookies.md2slides_owned)) : [];
    const updatedGists = ownedGists.filter((id: string) => id !== gistId);
    
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set(
      "Set-Cookie",
      `md2slides_owned=${encodeURIComponent(JSON.stringify(updatedGists))}; Path=/; Max-Age=31536000; SameSite=Lax`
    );

    return new Response(
      JSON.stringify({ success: true }),
      { headers }
    );
  } catch (error) {
    return Response.json(
      { error: "Failed to delete gist" },
      { status: 500 }
    );
  }
}