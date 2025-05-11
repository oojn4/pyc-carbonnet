import { lazy, Suspense } from "react";

const RouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-router-devtools").then((mod) => ({
        default: mod.TanStackRouterDevtools,
      }))
    );

const QueryDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-query-devtools").then((mod) => ({
        default: mod.ReactQueryDevtools,
      }))
    );

export const DevTools = () => {
  return (
    <Suspense>
      <RouterDevtools />
      <QueryDevtools />
    </Suspense>
  );
};
