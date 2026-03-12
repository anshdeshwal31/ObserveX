import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type StarBorderProps<T extends ElementType = "button"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  color?: string;
  speed?: string;
  thickness?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function StarBorder<T extends ElementType = "button">({
  as,
  children,
  className = "",
  innerClassName = "",
  color = "#ffffff",
  speed = "6s",
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
      <span
        className="absolute inset-0 rounded-[inherit] animate-spin"
        style={{
          animationDuration: speed,
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 70deg, ${color} 95deg, transparent 130deg, transparent 220deg, ${color} 250deg, transparent 290deg, transparent 360deg)`,
        }}
        aria-hidden="true"
      />
      <span className={`relative z-10 inline-flex items-center justify-center rounded-[inherit] ${innerClassName}`}>
        {children}
      </span>
    </Component>
  );
}
