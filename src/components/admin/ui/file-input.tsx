"use client";

import { useRef, useState, type InputHTMLAttributes } from "react";
import { AdminButton } from "./button";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  directory?: boolean;
};

export function AdminFileInput({ label = "Chọn file", directory, onChange, ...rest }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        {...rest}
        ref={(node) => {
          if (node && directory) node.setAttribute("webkitdirectory", "");
          ref.current = node;
        }}
        type="file"
        className="sr-only"
        onChange={(event) => {
          const files = [...(event.target.files || [])];
          setNames(files.length > 3 ? `${files.length} file` : files.map((file) => file.name).join(", "));
          onChange?.(event);
        }}
      />
      <AdminButton type="button" variant="secondary" size="sm" disabled={rest.disabled} onClick={() => ref.current?.click()}>
        {label}
      </AdminButton>
      {names ? <span className="min-w-0 truncate text-xs text-[var(--admin-text-muted)]">{names}</span> : null}
    </div>
  );
}
