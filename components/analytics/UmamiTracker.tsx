"use client";

/**
 * Sets a window flag when the resume owner views their own page.
 * The global Umami script's `data-before-send` handler checks this
 * flag and suppresses the page view event to avoid self-view inflation.
 *
 * Rendered server-side in the initial HTML so the flag is set before
 * the Umami tracker fires its first event.
 */
export function OwnerViewFlag() {
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: Static inline script setting window flag for Umami self-view filtering
    <script dangerouslySetInnerHTML={{ __html: "window.__clickfolioOwner=true" }} />
  );
}
