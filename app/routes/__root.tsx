import tailwind from "@/tailwind.css?url";
import geistMono from "@fontsource-variable/geist-mono?url";
import plusJakartaSans from "@fontsource-variable/plus-jakarta-sans?url";

import { DevTools } from "@/components/ui/dev-tools";
import { Toaster } from "@/components/ui/sonner";
import { RouterContext } from "@/router";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "CarbonNet",
      },
      {
        description:
          "CarbonNet is a platform that uses AI to analyze carbon data. ",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
      {
        rel: "stylesheet",
        href: tailwind,
      },
      {
        rel: "stylesheet",
        href: plusJakartaSans,
      },
      {
        rel: "stylesheet",
        href: geistMono,
      },
    ],
    scripts: import.meta.env.PROD
      ? []
      : [
          {
            type: "module",
            children: `
              import RefreshRuntime from "/_build/@react-refresh"
              RefreshRuntime.injectIntoGlobalHook(window)
              window.$RefreshReg$ = () => {}
              window.$RefreshSig$ = () => (type) => type
            `,
          },
        ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg" vaul-drawer-wrapper="">
        <Outlet />
        <Scripts />
        <Toaster position="top-center" />
        <DevTools />
      </body>
    </html>
  );
}

function NotFound() {
  return <div>Not Found</div>;
}
