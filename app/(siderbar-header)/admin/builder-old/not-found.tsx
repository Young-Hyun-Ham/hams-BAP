"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-md border bg-white p-6">
      <h2 className="mb-2 text-lg font-semibold">/chatbot 페이지를 찾을 수 없습니다.</h2>
      <Link href="/chatbot" className="text-blue-600 hover:underline">
        /chatbot로 돌아가기
      </Link>
    </div>
  );
}
