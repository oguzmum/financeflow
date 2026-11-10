import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

/** Placeholder page of the walking skeleton (WP-19). Real screens: WP-28 onwards. */
export function StartPage() {
  const info = useQuery({
    queryKey: ["system-info"],
    queryFn: async () => {
      const { data, error } = await api.GET("/system/info");
      if (error || !data) throw new Error("Systeminfo nicht erreichbar");
      return data;
    },
  });

  return (
    <main className="app-start">
      <div className="ff-card">
        <h1 className="ff-card__title">FinanceFlow</h1>
        <p className="ff-muted">Grundgerüst läuft.</p>
        <p className="text-small" data-testid="version">
          {info.isPending && "Verbinde …"}
          {info.isError && "Server nicht erreichbar"}
          {info.data && `Version ${info.data.version}`}
        </p>
      </div>
    </main>
  );
}
