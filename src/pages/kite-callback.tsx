import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { exchangeKiteRequestToken } from "@/lib/kite-api";

const processedTokens = new Set<string>();

export function KiteCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Connecting to Kite…");

  useEffect(() => {
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

    if (processedTokens.has(requestToken)) return;
    processedTokens.add(requestToken);

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
