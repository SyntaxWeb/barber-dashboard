import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type GoogleContext = "signin" | "signup";

type GoogleCredentialCallback = (response: { credential: string }) => void;

interface GoogleId {
  initialize: (options: {
    client_id: string;
    callback: GoogleCredentialCallback;
    ux_mode?: "popup" | "redirect";
    context?: GoogleContext;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

interface GoogleAccounts {
  id?: GoogleId;
}

interface GoogleNamespace {
  accounts?: GoogleAccounts;
}

declare global {
  interface Window {
    google?: GoogleNamespace;
  }
}

interface GoogleClientButtonProps {
  onCredential: (credential: string) => void;
  context?: GoogleContext;
  className?: string;
}

const GOOGLE_SCRIPT_ID = "google-client-script";

export function GoogleClientButton({ onCredential, context = "signin", className }: GoogleClientButtonProps) {
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    if (window.google) {
      setScriptReady(true);
      return;
    }

    let cancelled = false;
    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener(
        "load",
        () => {
          if (!cancelled) setScriptReady(true);
        },
        { once: true },
      );
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!cancelled) setScriptReady(true);
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonContainerRef.current) return;
    const google = window.google;
    if (!google?.accounts?.id) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          onCredential(response.credential);
        }
      },
      ux_mode: "popup",
      context,
      cancel_on_tap_outside: false,
    });

    buttonContainerRef.current.innerHTML = "";
    google.accounts.id.renderButton(buttonContainerRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: context === "signin" ? "signin_with" : "signup_with",
      width: 320,
      logo_alignment: "center",
    });
  }, [scriptReady, clientId, onCredential, context]);

  if (!clientId) {
    return (
      <div className={cn("text-center text-sm text-destructive", className)}>
        Configure a variável VITE_GOOGLE_CLIENT_ID para habilitar o login com Google.
      </div>
    );
  }

  return <div ref={buttonContainerRef} className={cn("flex justify-center", className)} />;
}
