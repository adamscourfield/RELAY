"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpenCheck,
  LayoutGrid,
  Lightbulb,
  LineChart,
  Mic,
  Radio,
  Upload,
} from "lucide-react";
import { FeedbackProvider, useFeedback } from "./Feedback";
import type { ReactNode, MouseEvent } from "react";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/live", label: "Live", icon: Mic },
  { href: "/lessons", label: "Lessons", icon: Radio },
  { href: "/lessons/new", label: "Import", icon: Upload },
  { href: "/behaviour", label: "Behaviour", icon: Award },
  { href: "/misconceptions", label: "Misconceptions", icon: Lightbulb },
  { href: "/insights", label: "Insights", icon: LineChart },
  { href: "/rubric", label: "Rubric", icon: BookOpenCheck },
];

// The mobile tab bar only has room for the five most-used destinations.
const MOBILE_NAV_EXCLUDE = new Set([
  "/lessons/new",
  "/behaviour",
  "/misconceptions",
]);

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/lessons")
    return pathname === "/lessons" || /^\/lessons\/(?!new)/.test(pathname);
  return pathname.startsWith(href);
}

const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  NAV.filter((n) => n.href !== "/").map((n) => [n.href.split("/")[1], n.label]),
);

function breadcrumbFor(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { href: string; label: string }[] = [{ href: "/", label: "Workspace" }];
  if (parts.length === 0) return [...crumbs, { href: "/", label: "Overview" }];
  const section = parts[0];
  crumbs.push({ href: `/${section}`, label: SECTION_LABELS[section] ?? "Page" });
  if (section === "lessons" && parts[1]) {
    crumbs[1] = { href: "/lessons", label: "Lessons" };
    crumbs.push({
      href: `/lessons/${parts[1]}`,
      label: parts[1] === "new" ? "Import" : "Lesson report",
    });
  } else if (parts[1]) {
    crumbs.push({ href: `/${parts.slice(0, 2).join("/")}`, label: "Detail" });
  }
  return crumbs;
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 px-2 group">
      <span className="relay-logo-mark relative grid place-items-center shrink-0">
        <svg width="22" height="22" viewBox="0 0 56 56" fill="none">
          <path
            d="M10 40 L28 16 L46 40"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="10" cy="40" r="5.5" fill="white" />
          <circle cx="28" cy="16" r="5.5" fill="white" />
          <circle cx="46" cy="40" r="5.5" fill="white" />
        </svg>
      </span>
      <span className="cadence-wordmark">RELAY</span>
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <FeedbackProvider>
      <ShellContent>{children}</ShellContent>
    </FeedbackProvider>
  );
}
function ShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const notify = useFeedback();
  function guardNavigation(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement).closest("a");
    if (!anchor || !document.querySelector('[data-cadence-recording="true"]'))
      return;
    const destination = new URL(anchor.href, location.href);
    if (
      destination.origin === location.origin &&
      destination.pathname !== pathname
    ) {
      event.preventDefault();
      event.stopPropagation();
      notify("End and save the lesson before changing pages.");
    }
  }
  const activeIndex = NAV.findIndex((n) => isActive(pathname, n.href));
  const crumbs = breadcrumbFor(pathname);
  return (
    <div className="shell-root" onClickCapture={guardNavigation}>
      <aside className="shell-sidebar">
        <Logo />
        <span className="eyebrow shell-nav-label">Workspace</span>
        <nav className="shell-nav" aria-label="Main navigation">
          <span
            className="nav-indicator"
            aria-hidden="true"
            style={{
              transform: `translateY(calc(${Math.max(0, activeIndex)} * var(--nav-step)))`,
            }}
          />
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/live" className="btn btn-primary mt-auto">
          <Mic size={16} />
          Start lesson
        </Link>
      </aside>
      <div className="shell-body">
        <header className="shell-topbar">
          <div className="topbar-logo">
            <Logo />
          </div>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol>
              {crumbs.map((c, i) => (
                <li key={`${c.href}-${i}`}>
                  {i === crumbs.length - 1 ? (
                    <span aria-current="page">{c.label}</span>
                  ) : (
                    <Link href={c.href}>{c.label}</Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </header>
        <main className="shell-main">
          <nav className="secondary-nav" aria-label="More pages">
            {NAV.filter((n) => MOBILE_NAV_EXCLUDE.has(n.href)).map(
              ({ href, label }) => (
                <Link
                  className="chip"
                  key={href}
                  href={href}
                  aria-current={isActive(pathname, href) ? "page" : undefined}
                >
                  {label}
                </Link>
              ),
            )}
          </nav>
          <div key={pathname} className="rise">
            {children}
          </div>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Main navigation">
        {NAV.filter((n) => !MOBILE_NAV_EXCLUDE.has(n.href)).map(
          ({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
            >
              <Icon size={20} />
              {label}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
