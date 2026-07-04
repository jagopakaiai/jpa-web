// Netlify Function: GitHub OAuth — token exchange + postMessage handoff
// GitHub redirects here with a one-time auth code after user consent.
// We exchange the code for an access token server-side (requires client_secret),
// then post the token back to the Sveltia admin window via popup handoff.
//
// Env vars required:
//   GITHUB_OAUTH_CLIENT_ID
//   GITHUB_OAUTH_CLIENT_SECRET
//   SITE_URL

const fetch = require("node-fetch");

exports.handler = async (event) => {
  const clientId = (process.env.GITHUB_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GITHUB_OAUTH_CLIENT_SECRET || "").trim();

  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      body: "OAuth not configured. Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET in Netlify env.",
    };
  }

  const code = event.queryStringParameters?.code;
  if (!code) {
    return { statusCode: 400, body: "Missing authorization code." };
  }

  let payload;
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    const data = await tokenRes.json();

    if (data.error) {
      payload = `authorization:github:error:${JSON.stringify({ error: data.error_description || data.error })}`;
    } else if (!data.access_token) {
      payload = `authorization:github:error:${JSON.stringify({ error: "no token returned" })}`;
    } else {
      payload = `authorization:github:success:${JSON.stringify({ token: data.access_token, provider: "github" })}`;
    }
  } catch (err) {
    payload = `authorization:github:error:${JSON.stringify({ error: String(err) })}`;
  }

  // Allowlist of origins for token handoff — derived from SITE_URL
  let allowedOrigins = [];
  try {
    const u = new URL((process.env.SITE_URL || "").trim());
    const bareHost = u.host.replace(/^www\./, "");
    allowedOrigins = [`${u.protocol}//${bareHost}`, `${u.protocol}//www.${bareHost}`];
  } catch (_) {
    allowedOrigins = [];
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Auth handoff</title></head>
<body>
  <p>Signing in… you can close this window if it doesn't close automatically.</p>
  <script>
    (function () {
      var payload = ${JSON.stringify(payload)};
      var allowedOrigins = ${JSON.stringify(allowedOrigins)};
      function receiveMessage(e) {
        if (e.source !== window.opener) return;
        if (allowedOrigins.indexOf(e.origin) === -1) return;
        if (e.data !== "authorizing:github") return;
        window.opener.postMessage(payload, e.origin);
        window.removeEventListener("message", receiveMessage, false);
      }
      window.addEventListener("message", receiveMessage, false);
      if (window.opener) {
        allowedOrigins.forEach(function (o) {
          window.opener.postMessage("authorizing:github", o);
        });
      }
    })();
  </script>
</body></html>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: html,
  };
};
