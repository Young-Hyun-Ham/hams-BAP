"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import UserEditModal, { type UserFormState } from "./components/modal/UserEditModal";
import useUserStore from "./store";
import type { AdminUser, AiChatType } from "./types";
import { decryptApiKey, encryptApiKey } from "@/lib/api-key";

const PAGE_SIZE = 10;

const providerLabel: Record<string, string> = {
  google: "Google",
  firebase: "Firebase",
  custom: "Custom",
};

const defaultModelByProvider: Record<AiChatType, string> = {
  gpt: "gpt-4",
  gemini: "gemini-2.0-flash",
  claude: "claude-3-5-sonnet-latest",
};

function createEmptyForm(): UserFormState {
  return {
    sub: "",
    name: "",
    nickname: "",
    loginId: "",
    email: "",
    phoneNumber: "",
    provider: "google",
    providerSubject: "",
    rolesText: "user",
    aiEnabled: true,
    aiChatType: "gpt",
    apiKey: "",
    chatModel: defaultModelByProvider.gpt,
    termsAcceptedAt: "",
    termsVersion: "",
    password: "",
    passwordConfirm: "",
  };
}

export default function AdminUserInfoPage() {
  const fetchUserList = useUserStore((state) => state.fetchUserList);
  const upsertUser = useUserStore((state) => state.upsertUser);
  const deleteUser = useUserStore((state) => state.deleteUser);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowSub, setSelectedRowSub] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormState>(createEmptyForm);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setUsers(await fetchUserList({}));
      setCurrentPage(1);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "사용자 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [fetchUserList]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    return users.filter((user) => {
      if (providerFilter !== "all" && (user.provider ?? "") !== providerFilter) {
        return false;
      }

      if (!searchText.trim()) {
        return true;
      }

      const keyword = searchText.toLowerCase();
      return [
        user.name ?? "",
        user.nickname ?? "",
        user.email ?? "",
        user.loginId ?? "",
        user.sub ?? "",
        user.phoneNumber ?? "",
      ].some((value) => value.toLowerCase().includes(keyword));
    });
  }, [providerFilter, searchText, users]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedUsers = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setForm(createEmptyForm());
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    const aiChatType = user.aiChatType ?? "gpt";
    setIsEditing(true);
    setSelectedUser(user);
    setForm({
      id: user.id,
      sub: user.sub,
      name: user.name ?? "",
      nickname: user.nickname ?? "",
      loginId: user.loginId ?? "",
      email: user.email ?? "",
      phoneNumber: user.phoneNumber ?? "",
      provider: user.provider ?? "google",
      providerSubject: user.providerSubject ?? "",
      rolesText: (user.roles ?? []).join(","),
      aiEnabled: user.aiEnabled ?? true,
      aiChatType,
      apiKey: decryptApiKey(user.apiKey) ?? "",
      chatModel: user.chatModel ?? defaultModelByProvider[aiChatType],
      termsAcceptedAt: user.termsAcceptedAt ?? "",
      termsVersion: user.termsVersion ?? "",
      password: "",
      passwordConfirm: "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedUser(null);
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target;
    const { name } = target;
    const value = target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : target.value;

    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "aiChatType") {
        const aiChatType = value as AiChatType;
        if (!prev.chatModel || prev.chatModel === defaultModelByProvider[prev.aiChatType]) {
          next.chatModel = defaultModelByProvider[aiChatType];
        }
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.sub.trim()) {
      alert("SUB(uid)는 필수입니다.");
      return;
    }

    const hasPasswordInput = form.password.trim().length > 0 || form.passwordConfirm.trim().length > 0;
    if (hasPasswordInput) {
      if (form.password.trim().length < 8) {
        alert("비밀번호는 8자 이상이어야 합니다.");
        return;
      }

      if (form.password !== form.passwordConfirm) {
        alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      await upsertUser({
        id: form.id,
        sub: form.sub.trim(),
        name: form.name.trim() || null,
        nickname: form.nickname.trim() || null,
        loginId: form.loginId.trim() || null,
        email: form.email.trim() || null,
        phoneNumber: form.phoneNumber.trim() || null,
        avatarUrl: null,
        roles: form.rolesText.split(",").map((role) => role.trim()).filter(Boolean),
        provider: form.provider || null,
        providerSubject: form.providerSubject.trim() || null,
        aiEnabled: form.aiEnabled,
        aiChatType: form.aiChatType,
        apiKey: encryptApiKey(form.apiKey.trim()) || null,
        chatModel: form.chatModel.trim() || null,
        termsAcceptedAt: form.termsAcceptedAt.trim() || null,
        termsVersion: form.termsVersion.trim() || null,
        password: hasPasswordInput ? form.password.trim() : undefined,
      });

      closeModal();
      await loadUsers();
    } catch (submitError) {
      console.error(submitError);
      setError(submitError instanceof Error ? submitError.message : "사용자 저장에 실패했습니다.");
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`"${user.name ?? user.sub}" 사용자를 삭제할까요?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteUser(user.sub);
      await loadUsers();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "사용자 삭제에 실패했습니다.");
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gray-50 p-6 font-sans">
      <div className="mb-4 text-sm text-gray-500">
        Admin
        <span className="mx-1"> / </span>
        <span className="font-semibold text-gray-800">사용자 정보</span>
      </div>

      <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">사용자 목록</h1>
          <button
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={openCreateModal}
            type="button"
          >
            + 사용자 등록
          </button>
        </div>

        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex w-full flex-col md:w-40">
            <label className="mb-1 text-xs font-medium text-gray-600">Provider</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm"
                onChange={(event) => setProviderFilter(event.target.value)}
                value={providerFilter}
              >
                <option value="all">All</option>
                <option value="google">Google</option>
                <option value="naver">Naver</option>
                <option value="kakao">Kakao</option>
                <option value="password">password</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={16}
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            <label className="mb-1 text-xs font-medium text-gray-600">
              Search (name / email / loginId / SUB)
            </label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="검색어를 입력하세요."
              value={searchText}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            총 <span className="font-semibold text-gray-800">{filtered.length}</span> 명
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="min-w-full table-fixed divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">#</th>
                <th className="w-40 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Name</th>
                <th className="w-48 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Login</th>
                <th className="w-56 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Email</th>
                <th className="w-32 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Provider</th>
                <th className="w-44 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">AI</th>
                <th className="w-48 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Last Login</th>
                {/* <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">SUB</th> */}
                <th className="w-24 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {pagedUsers.map((user, index) => (
                <tr
                  className="relative cursor-pointer hover:bg-gray-50"
                  key={user.sub}
                  onClick={() => setSelectedRowSub((prev) => (prev === user.sub ? null : user.sub))}
                >
                  <td className="whitespace-nowrap px-4 py-2 text-gray-800">{pageStart + index + 1}</td>
                  <td className="px-4 py-2 text-gray-800">
                    <div>{user.name ?? "-"}</div>
                    <div className="text-xs text-gray-400">{user.nickname ?? "-"}</div>
                  </td>
                  <td className="px-4 py-2 text-gray-800">
                    <div>{user.loginId ?? "-"}</div>
                    <div className="text-xs text-gray-400">{user.phoneNumber ?? "-"}</div>
                  </td>
                  <td className="px-4 py-2 text-gray-800">{user.email ?? "-"}</td>
                  <td className="px-4 py-2 text-gray-800">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                      {providerLabel[user.provider ?? "custom"] ?? user.provider}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-800">
                    <div>{user.aiEnabled === false ? "disabled" : user.aiChatType ?? "-"}</div>
                    {/* <div className="text-xs text-gray-400">{user.chatModel ?? "-"}</div> */}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-800">{user.lastLoginAt?.substring(0, 19) ?? "-"}</td>
                  {/* <td className="px-4 py-2 text-gray-400">
                    <span className="block w-full truncate" title={user.sub}>
                      {user.sub}
                    </span>
                  </td> */}
                  <td className="px-4 py-2 text-xs" />

                  {selectedRowSub === user.sub ? (
                    <td className="absolute inset-0 bg-white/70">
                      <div className="flex h-full w-full items-center justify-end gap-2 pr-4">
                        <button
                          className="rounded border border-gray-300 bg-white/90 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditModal(user);
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded border border-red-300 bg-white/90 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(user);
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}

              {!filtered.length && !loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-400" colSpan={9}>
                    사용자가 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 ? (
          <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
            <div>
              총 {totalItems}건 중 {pageStart + 1} - {Math.min(pageStart + PAGE_SIZE, totalItems)}건 표시
            </div>
            <div className="flex items-center gap-1">
              <button
                className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                type="button"
              >
                처음
              </button>
              <button
                className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                type="button"
              >
                이전
              </button>
              <span className="px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                type="button"
              >
                다음
              </button>
              <button
                className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                type="button"
              >
                마지막
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
        {loading ? <div className="mt-1 text-xs text-gray-500">Loading...</div> : null}
      </div>

      <UserEditModal
        form={form}
        isEditing={isEditing}
        isOpen={isModalOpen}
        loading={loading}
        onChange={handleFormChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
        userInfo={selectedUser}
      />
    </div>
  );
}
