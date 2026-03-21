export async function onRequestGet(context) {
  const { request, params } = context;
  const gistId = params.id;

  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(c => {
        const [key, ...v] = c.trim().split("=");
        return [key, v.join("=")];
      }).filter(([k]) => k)
    );
    
    const ownedGists = cookies.md2slides_owned ? JSON.parse(decodeURIComponent(cookies.md2slides_owned)) : [];
    const isOwned = ownedGists.includes(gistId);
    
    return Response.json({ owned: isOwned });
  } catch (error) {
    return Response.json({ owned: false });
  }
}