import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const isBrowser = typeof window !== "undefined";
  const isGhPages =
    isBrowser &&
    (window.location.pathname.startsWith("/Tap-Tap-Volcano") ||
      window.location.pathname.startsWith("/tap-tap-volcano"));
  const basepath = isGhPages
    ? window.location.pathname.startsWith("/Tap-Tap-Volcano")
      ? "/Tap-Tap-Volcano"
      : "/tap-tap-volcano"
    : undefined;

  const router = createRouter({
    routeTree,
    basepath,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
