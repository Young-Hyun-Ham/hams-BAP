// app/(sidebar-header)/admin/form-builder/components/FormBuilderSandbox.tsx
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import root from "react-shadow";

import { Button, Box, Typography } from "@mui/material";
import SectionArea from "./SectionArea";

const FormBuilder = dynamic(
  () => import("@formio/react").then((mod) => mod.FormBuilder),
  { ssr: false }
);

const Form = dynamic(() => import("@formio/react").then((mod) => mod.Form), {
  ssr: false,
});

const builderOptions = {
  builder: {
    data: false,
    premium: false,
  },
};

export default function FormBuilderSandbox() {
  const [formJson, setFormJson] = useState<any>(null);

  const [cssText, setCssText] = useState("");

  const [formSubmission, setFormSubmission] = useState<{ data: any }>({
    data: {
      external_options_data: [],
    },
  });

  const [loadingText, setLoadingText] = useState(
    "Trigger data change using postMessage:"
  );

  const [formPOC] = useState<any>({
    display: "form",
    components: [
      {
        label: "external data",
        key: "external_options_data",
        type: "hidden",
        input: true,
      },
      {
        label: "Select",
        key: "my_select",
        type: "select",
        widget: "choicesjs",
        input: true,
        dataSrc: "custom",
        data: {
          custom: "values = data.external_options_data ?? [];",
        },
        valueProperty: "value",
        template: "<span>{{ item.label }}</span>",
        clearOnRefresh: true,
        refreshOn: "external_options_data",
      },
      {
        label: "Text Logic",
        key: "textField",
        type: "textfield",
        input: true,
        logic: [
          {
            name: "Auto Lock and Fill",
            trigger: {
              type: "simple",
              simple: {
                when: "my_select",
                eq: "testLogic",
              },
            },
            actions: [
              {
                type: "property",
                property: {
                  value: "disabled",
                  type: "boolean",
                },
                state: true,
              },
              {
                type: "value",
                value: "value = 'Automatic value from logic';",
              },
            ],
          },
        ],
      },
    ],
  });

  /* ------------------ CSS 로딩 ------------------ */

  useEffect(() => {
    async function loadCss() {
      const [bootstrapCss, formioCss] = await Promise.all([
        fetch(
          "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        ).then((r) => r.text()),
        fetch(
          "https://cdn.jsdelivr.net/npm/@formio/js@4.15.0/dist/formio.full.min.css"
        ).then((r) => r.text()),
      ]);

      const css = `
        ${bootstrapCss}
        ${formioCss}

        :host {
          display:block;
          font-family:Arial, Helvetica, sans-serif;
        }

        .form-scope {
          background:white;
          padding:16px;
        }
      `;

      setCssText(css);
    }

    loadCss();
  }, []);

  /* ------------------ postMessage ------------------ */

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.origin) return;

      if (event.data.type === "SET_SELECT_OPTIONS") {
        const options = event.data.payload;

        setFormSubmission((prev) => ({
          data: {
            ...prev.data,
            external_options_data: options,
            my_select: options.length > 0 ? options[0].value : "",
          },
        }));
      }
    }

    handleDataCustom();

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  /* ------------------ 데이터 로딩 ------------------ */

  const handleFetchDataSelect = async (id: string) => {
    try {
      setLoadingText("Fetching.........");

      // const res = await commonCodeService.getDataFromCommonCode(id);
      const res = {} as any;
      window.postMessage(
        {
          type: "SET_SELECT_OPTIONS",
          payload: res.codes,
        },
        window.origin
      );

      setLoadingText(`Data for ${id} set.`);
    } catch (error) {
      setLoadingText("Failed to fetch data.");
      console.error(error);
    }
  };

  const handleDataCustom = () => {
    const customOptions = [
      { value: "showCondition", label: "Condition" },
      { value: "testLogic", label: "Logic" },
      { value: "customOption", label: "Custom Option" },
    ];

    window.postMessage(
      {
        type: "SET_SELECT_OPTIONS",
        payload: customOptions,
      },
      window.origin
    );

    setLoadingText("Custom options set.");
  };

  /* ------------------ UI ------------------ */

  return (
    <Box display="flex" flexDirection="column" height="100%" gap={1.5}>
      <Box display="flex" flex={1} gap={1.5} minHeight={0} overflow="hidden">
        {/* Builder */}

        <SectionArea flex={8} overflow="auto">
          <Typography variant="body2" fontWeight={600} mb={1}>
            Form Builder Packing Test
          </Typography>

          <root.div>
            <style>{cssText}</style>

            <div className="form-scope">
              <FormBuilder
                options={builderOptions}
                onChange={(form) => setFormJson(form)}
              />
            </div>
          </root.div>

          <SectionArea>
            <root.div>
              <style>{cssText}</style>

              <div className="form-scope">
                <Form form={formJson} src="#" />
              </div>
            </root.div>
          </SectionArea>
        </SectionArea>

        {/* POC 영역 */}

        {/*
        <SectionArea flex={2}>
          <Typography variant="body2" fontWeight={600} mb={1}>
            POC Test postMessage
          </Typography>

          <SectionArea>
            <root.div>
              <style>{cssText}</style>

              <div className="form-scope">
                <Form form={formPOC} submission={formSubmission} src="#" />
              </div>
            </root.div>

            <Typography
              component="pre"
              sx={{
                textAlign: 'center',
                color: 'grey.700',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
              }}
            >
              {loadingText}
            </Typography>

            <Box display="flex" gap={1} justifyContent="center">
              <Button variant="contained" onClick={() => handleDataCustom()}>
                custom
              </Button>

              <Button
                variant="contained"
                onClick={() => handleFetchDataSelect("ICD00004")}
              >
                ICD00004
              </Button>

              <Button
                variant="contained"
                onClick={() => handleFetchDataSelect("ICD00005")}
              >
                ICD00005
              </Button>
            </Box>
          </SectionArea> 
        </SectionArea>
        */}
      </Box>
    </Box>
  );
}