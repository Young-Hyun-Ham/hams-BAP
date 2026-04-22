type LoginOptions = {
  returnTo?: string;
};

function buildLoginUrl(returnTo?: string) {
  const url = new URL("/api/sso/login", window.location.origin);

  if (returnTo) {
    url.searchParams.set("returnTo", returnTo);
  }

  return url.toString();
}

function buildLogoutUrl(returnTo?: string) {
  const url = new URL("/api/auth/logout", window.location.origin);

  if (returnTo) {
    url.searchParams.set("returnTo", returnTo);
  }

  return url.toString();
}

export const createAuthSlice = (set: any, get: any) => ({
  token: null as string | null,

  setAuth(user: any, token: string | null) {
    set({ user, token, authChecked: true });
  },

  loginWithSSO(options?: LoginOptions) {
    const returnTo =
      options?.returnTo ??
      (typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/main");

    if (typeof window !== "undefined") {
      window.location.href = buildLoginUrl(returnTo);
    }
  },

  loginWithGoogle: async () => {
    get().loginWithSSO();
  },

  loginWithEmail: async () => {
    get().loginWithSSO();
  },

  loginWithTestId: async () => {
    get().loginWithSSO();
  },

  logout: async () => {
    const returnTo =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/main";

    set({ user: null, token: null, authChecked: true });
    get().clearUserAndData();

    if (typeof window !== "undefined") {
      window.location.href = buildLogoutUrl(returnTo);
    }
  },
});
