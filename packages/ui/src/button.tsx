import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost" | "icon" | "danger";

type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-action-gradient text-white",
  outline:
    "border border-hairline-strong bg-transparent text-ink hover:bg-hover active:bg-pressed",
  ghost: "bg-transparent text-secondary hover:bg-hover hover:text-ink active:bg-pressed",
  icon: "justify-center border border-hairline bg-transparent text-secondary hover:bg-hover hover:text-ink active:bg-pressed",
  danger: "bg-danger text-white hover:opacity-90",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-5 text-base",
};

const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

/**
 * The one button. `primary` is the logo's gradient (`bg-action-gradient`,
 * which carries its own hover and press) and there is ONE of it per screen:
 * Add to Mediary, Save, Follow. Everything else is an outline or a ghost, so
 * the primary action is the thing that stands out.
 *
 * Text on the primary fill is always white, in the disabled state too; a
 * disabled button dims as a whole.
 */
export const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`inline-flex cursor-pointer items-center rounded-control font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
      variant === "icon" ? ICON_SIZE_CLASSES[size] : SIZE_CLASSES[size]
    } ${VARIANT_CLASSES[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);
