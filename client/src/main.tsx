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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    },
  },
});

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
        // Forward auth token and portal identity from tab-isolated sessionStorage first (then role-scoped or localStorage)
        const headersMap: Record<string, string> = {};
        try {
          const path = typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "";
          let pathRole: string | null = null;
          if (path.includes("/student")) pathRole = "student";
          else if (path.includes("/teacher")) pathRole = "teacher";
          else if (path.includes("/parent")) pathRole = "parent";
          else if (path.includes("/admin")) pathRole = "admin";

          // Priority 1: sessionStorage (unique to this current browser tab)
          // Priority 2: pathRole-scoped user (e.g. rasi_user_student in sessionStorage or localStorage)
          // Priority 3: general localStorage
          let localUserRaw = sessionStorage.getItem("rasi_local_user");
          if (!localUserRaw && pathRole) {
            localUserRaw = sessionStorage.getItem(`rasi_user_${pathRole}`) || localStorage.getItem(`rasi_user_${pathRole}`);
          }
          if (!localUserRaw) {
            for (const role of ["admin", "teacher", "parent", "student"]) {
              const roleUser = sessionStorage.getItem(`rasi_user_${role}`);
              if (roleUser) {
                localUserRaw = roleUser;
                break;
              }
            }
          }
          if (!localUserRaw) {
            localUserRaw = localStorage.getItem("rasi_local_user");
          }

          let tokenRaw = sessionStorage.getItem("manus-cookie");
          if (!tokenRaw && pathRole) {
            tokenRaw = sessionStorage.getItem(`manus-cookie_${pathRole}`) || localStorage.getItem(`manus-cookie_${pathRole}`);
          }
          if (!tokenRaw) {
            for (const role of ["admin", "teacher", "parent", "student"]) {
              const roleToken = sessionStorage.getItem(`manus-cookie_${role}`);
              if (roleToken) {
                tokenRaw = roleToken;
                break;
              }
            }
          }
          if (!tokenRaw) {
            tokenRaw = localStorage.getItem("manus-cookie");
          }

          if (tokenRaw) {
            let token = "";
            if (tokenRaw.includes("=")) {
              const prefix = `${COOKIE_NAME}=`;
              const pair = tokenRaw.split(";").find(s => s.trim().startsWith(prefix));
              token = pair ? pair.trim().slice(prefix.length) : (tokenRaw.split("=")[1] || "");
            } else {
              token = tokenRaw;
            }
            if (token) {
              headersMap["Authorization"] = `Bearer ${token}`;
            }
          }

          if (localUserRaw) {
            try {
              const parsed = JSON.parse(localUserRaw);
              if (parsed.role) headersMap["x-demo-role"] = parsed.role;
              if (parsed.email) headersMap["x-demo-user"] = parsed.email;
              if (parsed.name) headersMap["x-demo-name"] = encodeURIComponent(parsed.name);
              if (parsed.linkedStudentEmail) headersMap["x-linked-student"] = parsed.linkedStudentEmail;
            } catch {}
          } else if (pathRole) {
            headersMap["x-demo-role"] = pathRole;
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
