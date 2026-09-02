import type { ReactNode } from "react";
import defaultLogo from "@/assets/syntax-logo.svg";
import loginBackground from "@/assets/login-barber-background.png";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101316] p-4 text-white">
      <img src={loginBackground} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(7,9,12,0.16),_rgba(5,7,10,0.78)_78%)]" />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 w-full max-w-md rounded-lg border border-[#9b6a43]/70 bg-[#13171b]/95 p-7 shadow-[0_28px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,211,161,0.18)] backdrop-blur">
        <div className="pointer-events-none absolute inset-0 rounded-lg bg-[linear-gradient(90deg,_transparent,_rgba(255,255,255,0.05),_transparent)] opacity-60 [background-size:14px_100%]" />
        <div className="relative">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#b7875f] bg-[#1a1d20] p-3 shadow-[0_14px_35px_rgba(0,0,0,0.45)]">
              <img src={defaultLogo} alt="SyntaxAtendimento" className="h-full w-full rounded-full object-cover" />
            </div>
          </div>
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-bold text-[#e6c895]">{title}</h1>
            <p className="mt-1 text-base text-zinc-100">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
