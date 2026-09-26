"use client";

export default function Icon({
  name,
  className = "",
  size = "base",
}: {
  name: string;
  className?: string;
  size?: "sm" | "base" | "lg";
}) {
  const sizes: Record<string, string> = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-xl",
  };
  return (
    <span className={`material-symbols-outlined ${sizes[size]} ${className}`.trim()}>
      {name}
    </span>
  );
}
