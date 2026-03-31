"use client";

import { Form } from "@formio/react";

export default function FormPreview({ schema }: { schema: any }) {
  return <Form form={schema} src="#" />;
}
