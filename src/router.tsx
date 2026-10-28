import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();
  let checkedInitialLocation = false;

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: ({ location }) => {
      if (!checkedInitialLocation) {
        checkedInitialLocation = true;
        if (location.pathname === "/" && !location.hash) return false;
      }
      return true;
    },
    defaultPreloadStaleTime: 0,
  });

  return router;
};
