import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StartPage } from "./StartPage";

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <StartPage />
    </QueryClientProvider>,
  );
}

describe("StartPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows the version from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ name: "FinanceFlow", version: "1.2.3" })),
    );
    renderPage();
    expect(await screen.findByText("Version 1.2.3")).toBeInTheDocument();
  });

  it("says so when the server is unreachable", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    expect(await screen.findByText("Server nicht erreichbar")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });
});
