import { create } from "zustand";

import {
  db,
  auth,
  doc,
  getDoc,
  collection,
  writeBatch,
  serverTimestamp,
  setDoc,
} from "@/lib/firebase";
import { locales } from "@/lib/locales";
import { createAuthSlice } from "@/store/slice/authSliceSso";
import { createUISlice } from "@/store/slice/uiSlice";
import { NavItem, SidebarMenu } from "@/types/nav";
import { User } from "@/types/user";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND ?? "firebase";

const getInitialMessages = (lang: any = "ko") => [
  { id: "initial", sender: "bot", text: locales[lang].initialBotMessage },
];

export const useStore: any = create((set: any, get: any) => ({
  db,
  auth,
  user: null,
  authChecked: false,
  backend: BACKEND,
  loginType: "sso",

  headerMenus: [],
  setHeaderMMenus: (data: NavItem) => {
    set({ headerMenus: data });
  },
  sidebarMenus: [],
  setSidebarMenus: (data: SidebarMenu) => {
    set({ sidebarMenus: data });
  },

  adminSidebarCollapsed: false,
  setAdminSidebarCollapsed: (v: any) => set({ adminSidebarCollapsed: v }),
  toggleAdminSidebarCollapsed: () =>
    set({ adminSidebarCollapsed: !get().adminSidebarCollapsed }),

  setUser: (user: User) => {
    set({ user });
  },
  setRoles: (role: string) => {
    const user = get().user;
    if (!user) return;

    const currentRoles = Array.isArray(user.roles) ? user.roles : [];
    if (!currentRoles.includes(role)) {
      set({
        user: {
          ...user,
          roles: Array.from(new Set([...(user.roles || []), role])),
        },
      });
    }
  },
  removeRole: (role: string) => {
    const user = get().user;
    if (!user) return;

    set({
      user: {
        ...user,
        roles: (user.roles || []).filter((r: string) => r !== role),
      },
    });
  },

  ...createAuthSlice(set, get),
  ...createUISlice(set, get),

  setUserAndLoadData: async (user: any) => {
    set({ user });
    const includeAdminAccount = process.env.NEXT_PUBLIC_ADMIN_ACCOUNT ?? [""];

    if (BACKEND === "firebase" && user?.uid) {
      try {
        const usersRef = collection(get().db, "users");
        const userRef = doc(usersRef, user.uid);
        const snap = await getDoc(userRef);

        const baseData = {
          sub: user.uid,
          email: user.email ?? null,
          name: user.displayName ?? user.name ?? "",
          avatar_url: user.photoURL ?? null,
          provider: user.provider ?? "sso",
          roles: user.roles ?? ["user"],
        };

        if (!snap.exists()) {
          await setDoc(userRef, {
            ...baseData,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          });
        } else {
          await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
        }
      } catch (err) {
        console.error("Firestore user upsert failed:", err);
      }
    }

    if (!Array.isArray(user.roles)) {
      get().setRoles("user");
      if (user.email && includeAdminAccount.includes(user.email)) {
        get().setRoles("admin");
      }
    } else if (user.email && includeAdminAccount.includes(user.email)) {
      get().setRoles("admin");
    }

    if (BACKEND === "postgres") {
      try {
        const updatesNeeded = 0;
        if (updatesNeeded <= 0) {
          console.log("No conversation migration needed.");
        }
      } catch (error) {
        console.error("Conversation migration failed:", error);
      }

      const theme = localStorage.getItem("theme") || "light";
      const fontSize = localStorage.getItem("fontSize") || "default";
      const language = localStorage.getItem("language") || "ko";

      set({
        theme,
        fontSize,
        language,
        messages: getInitialMessages(language),
      });
      return;
    }

    try {
      const batch = writeBatch(get().db);
      const updatesNeeded = 0;
      if (updatesNeeded > 0) {
        await batch.commit();
        console.log(`Migration complete: ${updatesNeeded} conversations updated.`);
      } else {
        console.log("No conversation migration needed.");
      }
    } catch (error) {
      console.error("Conversation migration failed:", error);
    }

    try {
      const userSettingsRef = doc(get().db, "settings", user.uid ?? user?.sub);
      const docSnap = await getDoc(userSettingsRef);
      const settings = docSnap.exists() ? docSnap.data() : {};

      const theme = settings.theme || localStorage.getItem("theme") || "light";
      const fontSize = settings.fontSize || localStorage.getItem("fontSize") || "default";
      const language = settings.language || localStorage.getItem("language") || "ko";

      set({
        theme,
        fontSize,
        language,
        messages: getInitialMessages(language),
      });
    } catch (error) {
      console.error("Error loading settings from Firestore:", error);
      const theme = localStorage.getItem("theme") || "light";
      const fontSize = localStorage.getItem("fontSize") || "default";
      const language = localStorage.getItem("language") || "ko";

      set({
        theme,
        fontSize,
        language,
        messages: getInitialMessages(language),
      });
    }
  },

  clearUserAndData: () => {
    let theme = "light";
    let fontSize = "default";
    let language = "ko";

    if (typeof window !== "undefined") {
      theme = localStorage.getItem("theme") || "light";
      fontSize = localStorage.getItem("fontSize") || "default";
      language = localStorage.getItem("language") || "ko";
    }

    set({
      user: null,
      token: null,
      authChecked: true,
      theme,
      fontSize,
      language,
      messages: getInitialMessages(language),
    });
  },

  initAuth: () => {
    const mePath = BACKEND === "postgres" ? "/api/auth/me/postgres" : "/api/auth/me/firebase";

    fetch(mePath, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("unauthorized");
        }

        const me = await response.json();
        set({
          user: me,
          token: me.accessToken ?? null,
          authChecked: true,
          loginType: "sso",
        });
        await get().setUserAndLoadData(me);
      })
      .catch(() => {
        get().clearUserAndData();
      });
  },
}));
