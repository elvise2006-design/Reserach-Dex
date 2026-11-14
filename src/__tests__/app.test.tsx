import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { demoApi } from "@/api/demo";
import App from "@/App";
import { AppProvider } from "@/context/AppContext";

function mount(path = "/") {
  return render(<MemoryRouter initialEntries={[path]}><AppProvider><App /></AppProvider></MemoryRouter>);
}
beforeEach(() => { localStorage.clear(); });

describe("demo api", () => {
  it("serves labelled sample data and refuses to fabricate answers", async () => {
    await demoApi.auth.login("a@b.c", "x").catch(() => null);
    const c = (await demoApi.corpora.list())[0];
    expect((await demoApi.papers.list(c.id)).length).toBeGreaterThan(0);
    const a = await demoApi.qa.ask(c.id, "zzz qqq unrelated gibberish");
    expect(a.answer).toMatch(/Demo mode|Insufficient/);
    expect(a.citations).toHaveLength(0);
  });
});

describe("app", () => {
  it("shows the sign-in screen when logged out", async () => {
    mount();
    expect(await screen.findByRole("button", { name: /sample data/i })).toBeInTheDocument();
  });
  it("enters demo mode, renders the dashboard and navigates to the library", async () => {
    const u = userEvent.setup();
    mount();
    await u.click(await screen.findByRole("button", { name: /sample data/i }));
    expect(await screen.findByText(/Welcome back, Researcher/i)).toBeInTheDocument();
    expect(await screen.findByText(/Papers analysed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/sample data/i).length).toBeGreaterThan(0);
    await u.click(within(screen.getAllByRole("navigation")[0]).getByRole("link", { name: /Research Library/i }));
    expect(await screen.findByRole("heading", { name: /Research Library/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/papers shown/i)).toBeInTheDocument());
  });
  it("filters the library by search text", async () => {
    const u = userEvent.setup();
    localStorage.setItem("rdx_mode", "demo"); localStorage.setItem("rdx_demo_user", JSON.stringify({ id: "d", email: "demo@researchdex.local" }));
    mount("/library");
    await waitFor(() => expect(screen.getByText(/papers shown/i)).toBeInTheDocument());
    const before = screen.getByText(/papers shown/i).textContent;
    await u.type(screen.getByLabelText(/search papers/i), "zzzznomatch");
    expect(await screen.findByText(/No papers match/i)).toBeInTheDocument();
    expect(before).not.toBe(screen.getByText(/papers shown/i).textContent);
  });
});
