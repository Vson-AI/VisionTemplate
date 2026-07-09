import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { SITE } from "./config";
import { LinkButton } from "./components/Button";

export const meta: Route.MetaFunction = () => [
  { title: SITE.name },
  { name: "description", content: SITE.description },
];

// Default to dark unless the visitor has explicitly chosen light. Runs before
// paint so there's no theme flash on load.
const themeBootScript = `(function(){try{var t=localStorage.getItem("theme");document.documentElement.classList.toggle("dark",t!=="light");}catch(e){document.documentElement.classList.add("dark");}})();`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-background">
        <div className="grain" aria-hidden="true" />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <main className="flex-1">
      <Outlet />
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <section className="container mx-auto flex flex-col items-center px-4 py-24 text-center sm:py-32">
      <p className="font-mono text-sm uppercase tracking-widest text-primary">
        {message}
      </p>
      <h1 className="text-display-sm mt-3 text-foreground">{details}</h1>
      <div className="mt-9">
        <LinkButton to="/" size="lg">
          Back home
        </LinkButton>
      </div>
      {stack && (
        <pre className="mt-10 w-full max-w-2xl overflow-x-auto rounded-lg border border-border bg-card p-4 text-left text-xs text-muted-foreground">
          <code>{stack}</code>
        </pre>
      )}
    </section>
  );
}
