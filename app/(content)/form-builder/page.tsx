"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Form } from "@formio/react";

import SectionArea from "@/components/SectionArea";
import FormBuilderCanvas from "./FormBuilderCanvas";

import "./form-builder.css";

const INITIAL_FORM: any = {
  type: "form",
  display: "form",
  components: [],
};

export default function FormBuilderUI() {
  const latestSchemaRef = useRef<any>(INITIAL_FORM);
  const [previewSchema, setPreviewSchema] = useState<any>(INITIAL_FORM);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const handleSchemaChange = useCallback((schema: any) => {
    latestSchemaRef.current = schema;
  }, []);

  const handleRefreshPreview = useCallback(() => {
    console.log("schema data =================>", latestSchemaRef.current)
    setPreviewSchema(latestSchemaRef.current);
  }, []);

  return (
    <div className="form-builder-light">
      <Box
        display="flex"
        flexDirection="column"
        height="100%"
        gap={1.5}
        sx={{ p: 2, minHeight: 0 }}
      >
        <Box display="flex" flex={1} gap={1.5} minHeight={0} overflow="hidden">
          <SectionArea flex={8} overflow="auto">
            <Typography variant="body2" fontWeight={600} mb={1}>
              Form Builder Packing Test
            </Typography>

            <div className="rounded-[28px] bg-white p-4 shadow-lg ring-1 ring-black/5 min-h-[720px] overflow-auto">
              <FormBuilderCanvas onSchemaChange={handleSchemaChange} />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleRefreshPreview}
                className="mb-3 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-md"
              >
                Preview 갱신
              </button>

              <SectionArea>
                <div className="rounded-[28px] bg-white p-4 shadow-lg ring-1 ring-black/5">
                  <Typography variant="body2" fontWeight={600} mb={2}>
                    Preview
                  </Typography>
                  <Form form={previewSchema} src={'#'} />
                </div>
              </SectionArea>
            </div>
          </SectionArea>
        </Box>
      </Box>
    </div>
  );
}