// app/api/oauth/google/callback/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies as getCookies } from 'next/headers';
import { db } from "@/lib/postgresql";
import { adminDb } from "@/lib/firebaseAdmin";
import { signAccessToken, signRefreshToken } from '@/lib/oauth';
import { isCrossSite, setAccessTokenCookie, setRefreshTokenCookie } from '@/lib/cookies';

import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import { roleTypes } from '@/types/user';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND ?? 'firebase';

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs')
);

type GoogleTokenResponse = {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: 'Bearer';
  scope: string;
  refresh_token?: string;
};

type GoogleIDPayload = JWTPayload & {
  sub: string;
  email?: string;
  name?: string;
  nonce?: string;
};

type AuthUser = {
  id: string;
  sub: string;
  email: string;
  name: string;
  roles: string[];
  provider: string;
  avatar_url?: string | null;
};

async function findOrCreateUserByBackend(sub: string, email: string, name: string): Promise<AuthUser | null> {
  if (BACKEND === 'firebase') {
    const userSnap = await adminDb.collection('users').where('email', '==', email).limit(1).get();

    if (!userSnap.empty) {
      const doc = userSnap.docs[0];
      const data = doc.data() as any;
      return {
        id: doc.id,
        sub: String(data.sub ?? doc.id),
        email: String(data.email ?? email),
        name: String(data.name ?? name),
        roles: Array.isArray(data.roles) ? data.roles.map(String) : ['user'],
        provider: String(data.provider ?? 'google'),
        avatar_url: data.avatar_url ?? null,
      };
    }

    const userRef = adminDb.collection('users').doc();
    const userData = {
      sub,
      email,
      name,
      roles: ['user'],
      provider: 'google',
      avatar_url: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    await userRef.set(userData, { merge: true });
    return {
      id: userRef.id,
      sub,
      email,
      name,
      roles: ['user'],
      provider: 'google',
      avatar_url: null,
    };
  }

  let users: any = await db.query(
    "SELECT id, sub, email, name, roles, 'google' as provider, avatar_url FROM users WHERE email = $1 limit 1;",
    [email]
  );

  if (users.rowCount === 0) {
    users = await db.query(
      `
      INSERT INTO users (sub, email, name, roles)
      VALUES ($1, $2, $3, $4)
      RETURNING id, sub, email, name, roles, 'google' as provider, avatar_url
      `,
      [sub, email, name, ['user']]
    );
  }

  const user = users.rows[0] ?? null;
  if (!user) return null;

  return {
    id: String(user.id),
    sub: String(user.sub ?? sub),
    email: String(user.email ?? email),
    name: String(user.name ?? name),
    roles: Array.isArray(user.roles)
      ? user.roles.map(String)
      : (typeof user.roles === 'string' ? [user.roles] : ['user']),
    provider: String(user.provider ?? 'google'),
    avatar_url: user.avatar_url ?? null,
  };
}

async function saveRefreshSessionByBackend(req: Request, userId: string, refreshToken: string) {
  const payload = {
    user_id: userId,
    token_hash: await bcrypt.hash(refreshToken, 10),
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    user_agent: req.headers.get('user-agent') ?? null,
    ip: req.headers.get('x-forwarded-for') ?? null,
    created_at: new Date(),
  };

  if (BACKEND === 'firebase') {
    await adminDb.collection('refresh_session').add(payload);
    return;
  }

  await db.query(
    `
      INSERT INTO refresh_session (user_id, token_hash, expires_at, user_agent, ip)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `,
    [payload.user_id, payload.token_hash, payload.expires_at, payload.user_agent ?? undefined, payload.ip ?? undefined]
  );
}

/**
 * @summary google callback
 * @description 구글 로그인 후 콜백 처리
 * @tag oauth
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_ORIGIN ?? 'http://localhost:3000'}/login?err=oauth_state`
    );
  }

  const cookieStore = await getCookies();
  const savedState = cookieStore.get('g_state')?.value;
  const savedNonce = cookieStore.get('g_nonce')?.value;
  const redirectPath = cookieStore.get('post_login_redirect')?.value ?? '/main';
  const loginFlow = cookieStore.get('g_flow')?.value ?? 'redirect';

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_ORIGIN ?? 'http://localhost:3000'}/login?err=invalid_state`
    );
  }

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    cache: 'no-store',
    body: new URLSearchParams({
      code,
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResp.ok) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_ORIGIN}/login?err=token_exchange`);
  }

  const tokenJson: GoogleTokenResponse = await tokenResp.json();
  const { payload } = await jwtVerify(tokenJson.id_token, GOOGLE_JWKS, {
    audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
  });
  const p = payload as GoogleIDPayload;

  if (savedNonce && p.nonce !== savedNonce) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_ORIGIN}/login?err=invalid_nonce`);
  }

  const sub = String(p.sub);
  const email = String(p.email ?? '');
  const name = String(p.name ?? email.split('@')[0] ?? 'user');

  const user = await findOrCreateUserByBackend(sub, email, name);
  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_ORIGIN ?? 'http://localhost:3000'}/login?err=user_upsert`);
  }

  const roles: roleTypes[] = user.roles.map((r) => String(r) as roleTypes);

  const access = signAccessToken({
    id: user.id,
    sub: user.sub,
    email: user.email,
    username: user.name,
    roles,
    provider: user.provider,
  });
  const jti = crypto.randomUUID();
  const refresh = signRefreshToken({ sub: user.id, jti });

  await saveRefreshSessionByBackend(req, user.id, refresh);

  const origin = process.env.NEXT_PUBLIC_ORIGIN ?? 'http://localhost:3000';
  let res: NextResponse;

  if (loginFlow === 'popup') {
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
      provider: user.provider,
      sub: user.sub,
      avatar_url: user.avatar_url ?? null,
    };

    const html = `
<!doctype html>
<html>
  <body>
    <script>
      (function() {
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              {
                type: "google-auth",
                accessToken: ${JSON.stringify(access)},
                refreshToken: ${JSON.stringify(refresh)},
                user: ${JSON.stringify(safeUser)}
              },
              ${JSON.stringify(origin)}
            );
          }
        } catch (e) {
          console.error("postMessage error:", e);
        }
        window.close();
      })();
    </script>
  </body>
</html>
`;

    res = new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } else {
    res = NextResponse.redirect(`${origin}${redirectPath}`);
  }

  setAccessTokenCookie(req, res, access, {
    crossSite: isCrossSite(req),
    maxAgeSec: 60 * Number(process.env.JWT_EXPIRES_IN ?? 10),
  });
  setRefreshTokenCookie(req, res, refresh, {
    crossSite: isCrossSite(req),
    maxAgeSec: 60 * 60 * 24 * 30,
  });

  res.cookies.set('g_state', '', { path: '/', maxAge: 0 });
  res.cookies.set('g_nonce', '', { path: '/', maxAge: 0 });
  res.cookies.set('g_flow', '', { path: '/', maxAge: 0 });
  res.cookies.set('post_login_redirect', '', { path: '/', maxAge: 0 });

  return res;
}
