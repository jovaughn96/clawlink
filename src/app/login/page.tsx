import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-background bg-dot-grid">
      {/* Radial spotlight */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.74_0.17_70/0.06)_0%,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <LoginForm />
      </div>
    </div>
  );
}
