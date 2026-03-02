// store/slice/authSlice.ts
import { firebaseLoginApi } from '@/lib/api/auth';
import { api } from '@/lib/axios';
import { db, addDoc, collection, doc, setDoc, signOut, serverTimestamp } from '@/lib/firebase';

export const createAuthSlice = (set: any, get: any) => ({
  token: null,
  setToken: (token: string) => set({ token }),

  loginWithGoogle: async () => {
    try {
      set({ loginType: "google" });
      localStorage.setItem("loginType", "google");

      const popup = window.open(
        '/api/oauth/google?flow=popup&redirect=/main',
        'googleLogin',
        'width=500,height=650'
      );

      if (!popup) {
        console.error('Popup blocked');
        return;
      }

      const expectedOrigin = process.env.NEXT_PUBLIC_ORIGIN ?? window.location.origin;

      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== expectedOrigin) return;
        if (!event.data || event.data.type !== 'google-auth') return;

        const { accessToken, user } = event.data;

        set({ user, token: accessToken, authChecked: true, loginType: 'google' });
        await get().setUserAndLoadData(user);

        window.removeEventListener('message', handleMessage);
        popup.close();
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error("Login with Google failed:", error);
    }
  },

  // 이메일/비밀번호 로그인
  loginWithEmail: async (email: string, password: string) => {
    try {
      set({ loginType: "email" });
      const { user, accessToken } = await firebaseLoginApi(email, password);

      // 새로고침 복구를 위해 저장
      localStorage.setItem("loginType", "email");
      // 공통 세션 세팅
      set({ user, token: accessToken, authChecked: true });
      await get().setUserAndLoadData(user);
    } catch (error) {
      console.error("Login with email failed:", error);
      throw error;
    }
  },

  loginWithTestId: async (userId: any) => {
    if (!userId || !userId.trim()) {
      console.error("Test User ID cannot be empty.");
      return;
    }

    set({ loginType: "test" });

    const mockUser: any = {
      displayName: `Test User (${userId.trim()})`,
      email: `${userId.trim()}@test.com`,
      photoURL: '/images/avatar.png',
      isTestUser: true,
      roles: ['guest'],
    };

    const testUserRef = collection(db, "test_users");
    const docRef = await addDoc(testUserRef, {
      ...mockUser,
      created_at: serverTimestamp(),
    });
    mockUser["uid"] = docRef.id;

    const newDocRef = doc(testUserRef);
    await setDoc(newDocRef, {
      ...mockUser,
      created_at: serverTimestamp(),
    });
    mockUser["uid"] = newDocRef.id;

    get().setUserAndLoadData(mockUser);
  },

  logout: async () => {
    try {
      if (get().user?.isTestUser) {
        get().clearUserAndData();
      } else if (get().loginType === "email") {
        try {
          await api.get("/api/auth/logout").catch(() => {});
          set({ user: null, token: null });
          get().clearUserAndData();
        } catch (error) {
          console.error("Logout failed:", error);
        }
      } else {
        await signOut(get().auth);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  },
});
