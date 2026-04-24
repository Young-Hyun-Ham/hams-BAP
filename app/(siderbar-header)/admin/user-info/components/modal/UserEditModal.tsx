"use client";

import type { ChangeEvent, FormEvent } from "react";

import type { AdminUser, AiChatType } from "../../types";

export type UserFormState = {
  id?: string;
  sub: string;
  name: string;
  nickname: string;
  loginId: string;
  email: string;
  phoneNumber: string;
  provider: string;
  providerSubject: string;
  rolesText: string;
  aiEnabled: boolean;
  aiChatType: AiChatType;
  apiKey: string;
  chatModel: string;
  termsAcceptedAt: string;
  termsVersion: string;
  password: string;
  passwordConfirm: string;
};

type Props = {
  isOpen: boolean;
  loading: boolean;
  isEditing: boolean;
  form: UserFormState;
  userInfo?: AdminUser | null;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
};

function inputClassName() {
  return "w-full rounded-md border border-gray-300 px-3 py-2 text-xs";
}

export default function UserEditModal({
  isOpen,
  loading,
  isEditing,
  form,
  userInfo,
  onChange,
  onSubmit,
  onClose,
}: Props) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-lg">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">
          {isEditing ? "사용자 정보 수정" : "사용자 등록"}
        </h2>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-600">SUB (uid)</label>
              <input
                className={inputClassName()}
                disabled={isEditing}
                name="sub"
                onChange={onChange}
                placeholder="SSO 사용자 ID"
                value={form.sub}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Provider</label>
              <select
                className={`${inputClassName()} bg-white`}
                name="provider"
                onChange={onChange}
                value={form.provider}
              >
                <option value="google">Google</option>
                <option value="firebase">Firebase</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Name</label>
              <input className={inputClassName()} name="name" onChange={onChange} value={form.name} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Nickname</label>
              <input className={inputClassName()} name="nickname" onChange={onChange} value={form.nickname} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Login ID</label>
              <input className={inputClassName()} name="loginId" onChange={onChange} value={form.loginId} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Email</label>
              <input className={inputClassName()} name="email" onChange={onChange} value={form.email} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Phone Number</label>
              <input className={inputClassName()} name="phoneNumber" onChange={onChange} value={form.phoneNumber} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Provider Subject</label>
              <input className={inputClassName()} name="providerSubject" onChange={onChange} value={form.providerSubject} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Roles</label>
              <input
                className={inputClassName()}
                name="rolesText"
                onChange={onChange}
                placeholder="user,admin"
                value={form.rolesText}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">AI Provider</label>
              <select
                className={`${inputClassName()} bg-white`}
                name="aiChatType"
                onChange={onChange}
                value={form.aiChatType}
              >
                <option value="gpt">GPT</option>
                <option value="gemini">Gemini</option>
                <option value="claude">Claude</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Chat Model</label>
              <input className={inputClassName()} name="chatModel" onChange={onChange} value={form.chatModel} />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-gray-600">API Key</label>
              <input className={inputClassName()} name="apiKey" onChange={onChange} type="password" value={form.apiKey} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Terms Version</label>
              <input className={inputClassName()} name="termsVersion" onChange={onChange} value={form.termsVersion} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Terms Accepted At</label>
              <input
                className={inputClassName()}
                name="termsAcceptedAt"
                onChange={onChange}
                placeholder="2026-04-23T00:00:00.000Z"
                value={form.termsAcceptedAt}
              />
            </div>

            <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-700">
              <input checked={form.aiEnabled} name="aiEnabled" onChange={onChange} type="checkbox" />
              AI chat enabled
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-600">
                Password
                {isEditing ? <span className="ml-1 text-gray-400">(leave blank to keep current)</span> : null}
              </label>
              <input
                autoComplete="new-password"
                className={inputClassName()}
                name="password"
                onChange={onChange}
                type="password"
                value={form.password}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Password Confirm</label>
              <input
                autoComplete="new-password"
                className={inputClassName()}
                name="passwordConfirm"
                onChange={onChange}
                type="password"
                value={form.passwordConfirm}
              />
            </div>
          </div>

          {isEditing && userInfo ? (
            <div className="space-y-1 text-[11px] text-gray-500">
              <div>Created: {userInfo.createdAt?.substring(0, 19) || "-"}</div>
              <div>Last login: {userInfo.lastLoginAt?.substring(0, 19) || "-"}</div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              disabled={loading}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
