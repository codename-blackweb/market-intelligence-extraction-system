"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeDollarSign,
  CircleHelp,
  FolderKanban,
  History,
  Home,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserRound
} from "lucide-react";

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
  sectionId?: string;
};

const primaryItems: NavItem[] = [
  { label: "Home", icon: Home, href: "/#home", sectionId: "home" },
  { label: "Run Analysis", icon: Search, href: "/#run-analysis", sectionId: "run-analysis" },
  {
    label: "Recent Analyses",
    icon: History,
    href: "/#recent-analyses",
    sectionId: "recent-analyses"
  },
  { label: "Pricing", icon: BadgeDollarSign, href: "/#pricing", sectionId: "pricing" },
  { label: "FAQ", icon: CircleHelp, href: "/#faq", sectionId: "faq" }
];

const secondaryItems: NavItem[] = [
  { label: "Account", icon: UserRound, href: "/account" },
  { label: "Workspace", icon: FolderKanban, href: "/workspace" },
  { label: "Billing", icon: BadgeDollarSign, href: "/billing" }
];

const railVariants = {
  collapsed: {
    width: 76
  },
  expanded: {
    width: 248
  }
};

const drawerVariants = {
  closed: {
    x: "-100%",
    opacity: 0.96
  },
  open: {
    x: 0,
    opacity: 1
  }
};

function useActiveSection(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    if (typeof window === "undefined" || !sectionIds.length) {
      return;
    }

    const observedElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!observedElements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (visibleEntries[0]?.target.id) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.12, 0.3, 0.55]
      }
    );

    observedElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [sectionIds]);

  return activeSection;
}

function SideNavItem({
  item,
  index,
  expanded,
  active,
  mobile = false,
  onNavigate
}: {
  item: NavItem;
  index: number;
  expanded: boolean;
  active: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`side-nav-item ${active ? "is-active" : ""} ${mobile ? "is-mobile" : ""}`}
      href={item.href}
      onClick={onNavigate}
    >
      <span className="side-nav-item-icon">
        <Icon className="h-4 w-4" />
      </span>
      <motion.span
        animate={{
          opacity: expanded ? 1 : 0,
          x: expanded ? 0 : -8
        }}
        className="side-nav-item-label"
        initial={false}
        transition={{
          delay: expanded ? 0.04 + index * 0.035 : 0,
          duration: expanded ? 0.24 : 0.16,
          ease: "easeOut"
        }}
      >
        {item.label}
      </motion.span>
    </Link>
  );
}

export default function SideNav() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hiddenOnRoute = pathname.startsWith("/auth") || pathname.startsWith("/onboarding");
  const expanded = hovered || pinned;

  const activeSection = useActiveSection(primaryItems.map((item) => item.sectionId ?? "").filter(Boolean));
  const isHomeRoute = pathname === "/";

  const activeHref = useMemo(() => {
    if (pathname === "/account" || pathname === "/workspace" || pathname === "/billing") {
      return pathname;
    }

    if (isHomeRoute) {
      const matched = primaryItems.find((item) => item.sectionId === activeSection);
      return matched?.href ?? "/#home";
    }

    return pathname;
  }, [activeSection, isHomeRoute, pathname]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  if (hiddenOnRoute) {
    return null;
  }

  return (
    <>
      <button
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        className="mobile-side-nav-toggle"
        onClick={() => setMobileOpen((current) => !current)}
        type="button"
      >
        <Menu className="h-5 w-5" />
      </button>

      <motion.aside
        animate={expanded ? "expanded" : "collapsed"}
        className="side-nav-rail"
        initial={false}
        onHoverEnd={() => setHovered(false)}
        onHoverStart={() => setHovered(true)}
        variants={railVariants}
      >
        <div className="side-nav-inner">
          <button
            aria-label={pinned ? "Collapse navigation" : "Pin navigation open"}
            className="side-nav-toggle"
            onClick={() => setPinned((current) => !current)}
            type="button"
          >
            {expanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>

          <div className="side-nav-group">
            {primaryItems.map((item, index) => (
              <SideNavItem
                active={activeHref === item.href}
                expanded={expanded}
                index={index}
                item={item}
                key={item.label}
              />
            ))}
          </div>

          <div className="side-nav-divider" />

          <div className="side-nav-group">
            {secondaryItems.map((item, index) => (
              <SideNavItem
                active={pathname === item.href}
                expanded={expanded}
                index={primaryItems.length + index}
                item={item}
                key={item.label}
              />
            ))}
          </div>
        </div>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="mobile-side-nav-backdrop"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              animate="open"
              className="mobile-side-nav-panel"
              exit="closed"
              initial="closed"
              onClick={(event) => event.stopPropagation()}
              transition={{ duration: 0.26, ease: "easeOut" }}
              variants={drawerVariants}
            >
              <div className="mobile-side-nav-header">
                <p>Navigate</p>
                <button
                  aria-label="Close navigation"
                  className="side-nav-toggle"
                  onClick={() => setMobileOpen(false)}
                  type="button"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>

              <motion.div
                animate="open"
                className="mobile-side-nav-group"
                initial="closed"
                variants={{
                  open: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.06
                    }
                  },
                  closed: {}
                }}
              >
                {[...primaryItems, ...secondaryItems].map((item, index) => (
                  <motion.div
                    key={item.label}
                    variants={{
                      open: {
                        opacity: 1,
                        x: 0
                      },
                      closed: {
                        opacity: 0,
                        x: -14
                      }
                    }}
                  >
                    <SideNavItem
                      active={activeHref === item.href || pathname === item.href}
                      expanded
                      index={index}
                      item={item}
                      mobile
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
