"use client";

import { memo, useMemo } from "react";
import { FormBuilder } from "@formio/react";

import "bootstrap/dist/css/bootstrap.min.css";
import "@formio/js/dist/formio.full.min.css";

const INITIAL_FORM: any = {
  type: "form",
  display: "form",
  components: [],
};

type Props = {
  onSchemaChange: (schema: any) => void;
};

function FormBuilderCanvasInner({ onSchemaChange }: Props) {
  const builderOptions = useMemo(
    () => ({
      builder: {
        basic: {
          title: "Basic",
          weight: 0,
          default: true,
          components: {
            textfield: true,
            textarea: true,
            number: true,
            password: true,
            checkbox: true,
            selectboxes: true,
            select: true,
            radio: true,
            button: true,
          },
        },
        advanced: {
          title: "Advanced",
          weight: 10,
          components: {
            email: true,
            url: true,
            phoneNumber: true,
            tags: true,
            address: true,
            signature: true,
          },
        },
        layout: {
          title: "Layout",
          weight: 20,
          components: {
            columns: true,
            fieldset: true,
            panel: true,
            table: true,
            tabs: true,
            well: true,
            html: true,
          },
        },
        data: {
          title: "Data",
          weight: 30,
          components: {
            hidden: true,
            container: true,
            datamap: true,
            datagrid: true,
            editgrid: true,
          },
        },
        premium: false,
      },
    }),
    []
  );

  return (
    <FormBuilder
      initialForm={INITIAL_FORM}
      options={builderOptions}
      onChange={onSchemaChange}
    />
  );
}

const FormBuilderCanvas = memo(FormBuilderCanvasInner);
export default FormBuilderCanvas;