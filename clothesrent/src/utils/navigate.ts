// Lightweight client-side navigation — no full page reloads.

const listeners = new Set<() => void>();

export function navigate(to: string) {
    if (to === window.location.pathname) return;
    window.history.pushState(null, "", to);
    listeners.forEach((fn) => fn());
}

export function onNavigate(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

// Intercept all internal <a> clicks to use pushState instead of reload.
if (typeof window !== "undefined") {
    window.addEventListener("click", (e) => {
        const anchor = (e.target as HTMLElement).closest("a");
        if (!anchor) return;

        const href = anchor.getAttribute("href");
        if (!href) return;

        // Skip external links, new-tab links, and special protocols
        if (
            href.startsWith("http") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:") ||
            anchor.target === "_blank" ||
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey
        ) {
            return;
        }

        // Internal link — intercept
        e.preventDefault();
        navigate(href);
    });

    // Handle browser back/forward
    window.addEventListener("popstate", () => {
        listeners.forEach((fn) => fn());
    });
}
