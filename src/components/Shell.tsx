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

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 px-2 group">
      <span className="relative grid place-items-center size-9 shrink-0 rounded-[10px] bg-[linear-gradient(135deg,var(--ink),var(--ink-2))] transition-transform group-hover:scale-105">
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
      <span className="cadence-wordmark font-semibold tracking-tight text-[16px]">RELAY</span>
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
  return (
    <div className="flex min-h-screen" onClickCapture={guardNavigation}>
      <aside className="shell-sidebar">
        <Logo />
        <nav className="shell-nav" aria-label="Main navigation">
          <span
            className="nav-indicator"
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
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/live" className="btn btn-primary mt-auto">
          <Mic size={14} />
          Start lesson
        </Link>
      </aside>
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
      <nav className="mobile-nav" aria-label="Main navigation">
        {NAV.filter((n) => !MOBILE_NAV_EXCLUDE.has(n.href)).map(
          ({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
            >
              <Icon size={18} />
              {label}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
