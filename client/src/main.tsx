import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";
import "./portfolio.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // If the user is currently in a local portal session (Student/Parent/Admin/Teacher),
  // suppress the external OAuth portal redirect so they are not kicked out on refresh or transient 401.
  try {
    const hasLocal = localStorage.getItem("rasi_local_user") || localStorage.getItem("rasi_active_portal") || localStorage.getItem("demo-user-email");
    if (hasLocal) {
      console.warn("[Auth] 401 received while portal session is active; keeping user in workspace");
      return;
    }
  } catch {}

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  if (oauthPortalUrl && oauthPortalUrl !== "undefined") {
    startLogin();
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Forward auth token and portal identity from localStorage (with sessionStorage fallback)
        const headersMap: Record<string, string> = {};
        try {
          const raw = localStorage.getItem("manus-cookie") || sessionStorage.getItem("manus-cookie");
          if (raw) {
            let token = "";
            if (raw.includes("=")) {
              const prefix = `${COOKIE_NAME}=`;
              const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
              token = pair ? pair.trim().slice(prefix.length) : (raw.split("=")[1] || "");
            } else {
              token = raw;
            }
            if (token) {
              headersMap["Authorization"] = `Bearer ${token}`;
            }
          }
          const demoUser = localStorage.getItem("demo-user-email") || sessionStorage.getItem("demo-user-email");
          if (demoUser) {
            headersMap["x-demo-user"] = demoUser;
          }
          const localUserRaw = localStorage.getItem("rasi_local_user") || sessionStorage.getItem("rasi_local_user");
          if (localUserRaw) {
            try {
              const parsed = JSON.parse(localUserRaw);
              if (parsed.role) headersMap["x-demo-role"] = parsed.role;
              if (parsed.email) headersMap["x-demo-user"] = parsed.email;
              if (parsed.linkedStudentEmail) headersMap["x-linked-student"] = parsed.linkedStudentEmail;
            } catch {}
          }
        } catch {
          // storage unavailable
        }
        return headersMap;
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
