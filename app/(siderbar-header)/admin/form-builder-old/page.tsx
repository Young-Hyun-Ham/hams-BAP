"use client";

import FormBuilderSandbox from "@/components/FormBuilderSandbox";
import "./form-builder.css";

export default function FormBuilderPage() {
  return (
    <div className="h-full min-h-0 p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Form Builder</h1>
          <p className="mt-1 text-sm text-gray-500">
            관리자 레이아웃 스타일은 유지하고, Form.io 영역만 별도로 격리합니다.
          </p>
        </div>

        <div className="rounded-[32px] bg-white/70 p-4 shadow-xl shadow-black/5 ring-1 ring-black/5 backdrop-blur-sm">
          <FormBuilderSandbox />
        </div>
      </div>
    </div>
  );
}