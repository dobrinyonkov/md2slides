export async function onRequestGet(context) {
  const { request, env } = context;
  const GITHUB_TOKEN = env.GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    return Response.json({ gists: [] });
  }

  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(c => {
        const [key, ...v] = c.trim().split("=");
        return [key, v.join("=")];
      }).filter(([k]) => k)
    );
    
    const ownedGists = cookies.md2slides_owned ? JSON.parse(decodeURIComponent(cookies.md2slides_owned)) : [];
    
    if (ownedGists.length === 0) {
      return Response.json({ gists: [] });
    }

    const gistPromises = ownedGists.map(async (gistId: string) => {
      try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "User-Agent": "md2slides",
          },
        });
        
        if (!response.ok) return null;
        
        const gist = await response.json();
        let title = "Untitled Presentation";
        
        if (gist.files["metadata.json"]) {
          try {
            const metadata = JSON.parse(gist.files["metadata.json"].content);
            title = metadata.title || title;
          } catch (e) {
          }
        }
        
        return {
          id: gist.id,
          title,
          description: gist.description,
          updatedAt: gist.updated_at,
          url: gist.html_url,
        };
      } catch (error) {
        return null;
      }
    });
    
    const gists = (await Promise.all(gistPromises)).filter(g => g !== null);
    return Response.json({ gists });
  } catch (error) {
    return Response.json({ gists: [] });
  }
}