// Netlify Function: GitHub OAuth — initial redirect
// Sveltia CMS opens this URL. We redirect to GitHub's OAuth consent screen.
// Env vars required (set in Netlify dashboard):
//   GITHUB_OAUTH_CLIENT_ID
//   SITE_URL — e.g. https://jpa.my.id

exports.handler = async (event) => {
  const clientId = (process.env.GITHUB_OAUTH_CLIENT_ID || "").trim();
  const siteUrl = (process.env.SITE_URL || "").trim();

  if (!clientId || !siteUrl) {
    return {
      statusCode: 500,
      body: "OAuth not configured. Set GITHUB_OAUTH_CLIENT_ID and SITE_URL in Netlify env.",
    };
  }

  const state = event.queryStringParameters?.state || "";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${siteUrl}/.netlify/functions/auth-callback`,
    scope: "repo,user",
    state,
  });

  return {
    statusCode: 302,
    headers: { Location: `https://github.com/login/oauth/authorize?${params}` },
  };
};
