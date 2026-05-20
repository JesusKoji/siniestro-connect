import logo from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Logo = ({ size = "md", className = "" }: LogoProps) => {
  const sizes = {
    sm: "h-12",
    md: "h-16",
    lg: "h-24",
  };
  return (
    <img
      src={logo}
      alt="JS Peritaciones"
      className={`${sizes[size]} w-auto object-contain ${className}`}
    />
  );
};
