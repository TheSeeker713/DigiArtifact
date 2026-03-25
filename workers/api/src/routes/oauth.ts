/**
 * Google OAuth routes for Cloudflare Workers
 */
import { Env, User, createJWT, jsonResponse } from '../utils';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

function getRootCookieDomain(frontendUrl: string): string | null {
  try {
    const host = new URL(frontendUrl).hostname;
    if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return null;
    }
    const parts = host.split(".");
    if (parts.length < 2) {
      return null;
    }
    return `.${parts.slice(-2).join(".")}`;
  } catch {
    return null;
  }
}

function getCookie(request: Request, cookieName: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const match = cookies.find((item) => item.startsWith(`${cookieName}=`));
  if (!match) {
    return null;
  }
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

/**
 * Generate the Google OAuth authorization URL
 */
export async function handleOAuthStart(
  request: Request,
  env: Env,
  origin: string
): Promise<Response> {
  if (!env.JWT_SECRET) {
    return jsonResponse({ error: "Server auth config missing" }, 500, origin);
  }
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = `${env.API_BASE_URL}/api/auth/google/callback`;
  const state = crypto.randomUUID();
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  const response = Response.redirect(authUrl, 302);
  const cookieDomain = getRootCookieDomain(env.FRONTEND_URL);
  const stateCookie = [
    `oauth_state=${encodeURIComponent(state)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=900",
    cookieDomain ? `Domain=${cookieDomain}` : null,
  ]
    .filter(Boolean)
    .join("; ");
  response.headers.append("Set-Cookie", stateCookie);
  return response;
}

/**
 * Handle Google OAuth callback - exchange code for tokens
 */
export async function handleOAuthCallback(
  request: Request,
  env: Env,
  origin: string
): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const state = url.searchParams.get("state");
  const cookieState = getCookie(request, "oauth_state");

  if (error) {
    // Redirect to login page with error
    return Response.redirect(`${env.FRONTEND_URL}?error=${encodeURIComponent(error)}`, 302);
  }

  if (!code) {
    return Response.redirect(`${env.FRONTEND_URL}?error=no_code`, 302);
  }
  if (!state || !cookieState || state !== cookieState) {
    return Response.redirect(`${env.FRONTEND_URL}?error=state_mismatch`, 302);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${env.API_BASE_URL}/api/auth/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return Response.redirect(`${env.FRONTEND_URL}?error=token_exchange_failed`, 302);
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return Response.redirect(`${env.FRONTEND_URL}?error=user_info_failed`, 302);
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();
    if (!googleUser.verified_email) {
      return Response.redirect(`${env.FRONTEND_URL}?error=email_not_verified`, 302);
    }

    // Find or create user in database
    let user = await env.DB.prepare(
      'SELECT id, email, name, role FROM users WHERE google_id = ? OR email = ?'
    ).bind(googleUser.id, googleUser.email).first<User & { google_id?: string }>();

    if (!user) {
      // Check if signups are allowed (optional - can restrict to existing users)
      const allowSignups = env.ALLOW_SIGNUPS === 'true';
      
      if (!allowSignups) {
        return Response.redirect(
          `${env.FRONTEND_URL}?error=not_authorized&message=Contact administrator for access`,
          302
        );
      }

      // Create new user
      const result = await env.DB.prepare(`
        INSERT INTO users (email, name, google_id, google_picture, role, active)
        VALUES (?, ?, ?, ?, 'worker', 1)
      `).bind(googleUser.email, googleUser.name, googleUser.id, googleUser.picture).run();

      user = {
        id: result.meta.last_row_id as number,
        email: googleUser.email,
        name: googleUser.name,
        role: 'worker',
      };
    } else if (!user.google_id) {
      // Existing user logging in with Google for first time - link accounts
      await env.DB.prepare(`
        UPDATE users SET google_id = ?, google_picture = ?, updated_at = datetime("now")
        WHERE id = ?
      `).bind(googleUser.id, googleUser.picture, user.id).run();
    }

    // Create JWT for our app
    const appToken = await createJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    }, env.JWT_SECRET);

    const dashboardUrl = new URL(`${env.FRONTEND_URL}/dashboard`);
    const response = Response.redirect(dashboardUrl.toString(), 302);
    const cookieDomain = getRootCookieDomain(env.FRONTEND_URL);
    const userPayload = encodeURIComponent(
      JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role })
    );

    const authCookie = [
      `workers_token=${encodeURIComponent(appToken)}`,
      "Path=/",
      "Secure",
      "SameSite=Lax",
      "Max-Age=604800",
      cookieDomain ? `Domain=${cookieDomain}` : null,
    ]
      .filter(Boolean)
      .join("; ");
    const userCookie = [
      `workers_user=${userPayload}`,
      "Path=/",
      "Secure",
      "SameSite=Lax",
      "Max-Age=604800",
      cookieDomain ? `Domain=${cookieDomain}` : null,
    ]
      .filter(Boolean)
      .join("; ");
    const clearStateCookie = [
      "oauth_state=",
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      "Max-Age=0",
      cookieDomain ? `Domain=${cookieDomain}` : null,
    ]
      .filter(Boolean)
      .join("; ");
    response.headers.append("Set-Cookie", authCookie);
    response.headers.append("Set-Cookie", userCookie);
    response.headers.append("Set-Cookie", clearStateCookie);
    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.redirect(`${env.FRONTEND_URL}?error=server_error`, 302);
  }
}

/**
 * Verify Google ID token (for client-side Google Sign-In)
 * This is an alternative flow where the frontend handles the OAuth popup
 */
export async function handleVerifyGoogleToken(
  request: Request,
  env: Env,
  origin: string
): Promise<Response> {
  const { credential } = await request.json() as { credential: string };

  if (!credential) {
    return jsonResponse({ error: 'No credential provided' }, 400, origin);
  }

  try {
    // Verify the ID token with Google
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!response.ok) {
      return jsonResponse({ error: 'Invalid token' }, 401, origin);
    }

    const payload = await response.json() as {
      sub: string;      // Google user ID
      email: string;
      email_verified: string;
      name: string;
      picture: string;
      aud: string;      // Client ID
    };

    // Verify the token was issued for our app
    if (payload.aud !== env.GOOGLE_CLIENT_ID) {
      return jsonResponse({ error: 'Token not issued for this app' }, 401, origin);
    }
    if (payload.email_verified !== "true") {
      return jsonResponse({ error: "Google account email must be verified" }, 401, origin);
    }

    // Find or create user
    let user = await env.DB.prepare(
      'SELECT id, email, name, role FROM users WHERE google_id = ? OR email = ?'
    ).bind(payload.sub, payload.email).first<User & { google_id?: string }>();

    if (!user) {
      const allowSignups = env.ALLOW_SIGNUPS === 'true';
      
      if (!allowSignups) {
        return jsonResponse({ 
          error: 'Not authorized',
          message: 'Contact administrator for access'
        }, 403, origin);
      }

      // Create new user
      const result = await env.DB.prepare(`
        INSERT INTO users (email, name, google_id, google_picture, role, active)
        VALUES (?, ?, ?, ?, 'worker', 1)
      `).bind(payload.email, payload.name, payload.sub, payload.picture).run();

      user = {
        id: result.meta.last_row_id as number,
        email: payload.email,
        name: payload.name,
        role: 'worker',
      };
    } else if (!user.google_id) {
      // Link existing user to Google account
      await env.DB.prepare(`
        UPDATE users SET google_id = ?, google_picture = ?, updated_at = datetime("now")
        WHERE id = ?
      `).bind(payload.sub, payload.picture, user.id).run();
    }

    // Create our app's JWT
    const token = await createJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    }, env.JWT_SECRET);

    return jsonResponse({ token, user }, 200, origin);
  } catch (error) {
    console.error('Token verification error:', error);
    return jsonResponse({ error: 'Token verification failed' }, 500, origin);
  }
}
