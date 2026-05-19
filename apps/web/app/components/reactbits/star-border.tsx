import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type StarBorderProps<T extends ElementType = "button"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  thickness?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function StarBorder<T extends ElementType = "button">({
  as,
  children,
  className = "",
  innerClassName = "",
  thickness = 2,
  ...rest
}: StarBorderProps<T>) {
  const Component = (as ?? "button") as ElementType;

  return (
    <Component
      className={`relative inline-flex overflow-hidden rounded-full ${className}`}
      style={{ padding: thickness }}
      {...rest}
    >
      {/* Decorative background removed per user request */}
      <span className={`relative z-10 inline-flex items-center justify-center rounded-[inherit] ${innerClassName}`}>
        {children}
      </span>
    </Component>
  );
}
