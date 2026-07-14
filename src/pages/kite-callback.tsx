import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { exchangeKiteRequestToken } from "@/lib/kite-api";

export function KiteCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ran = useRef(false);
  const [message, setMessage] = useState("Connecting to Kite…");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const status = params.get("status");
    const requestToken = params.get("request_token");

    if (status && status !== "success") {
      toast.error("Kite login was cancelled or failed");
      navigate("/", { replace: true });
      return;
    }

    if (!requestToken) {
      toast.error("Missing request token from Kite");
      navigate("/", { replace: true });
      return;
    }

    exchangeKiteRequestToken(requestToken)
      .then((res) => {
        toast.success(
          `Connected to Kite${res.kite_username ? ` as ${res.kite_username}` : ""}`,
        );
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to connect Kite";
        toast.error(msg);
        setMessage(msg);
      })
      .finally(() => {
        navigate("/", { replace: true });
      });
  }, [params, navigate]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
