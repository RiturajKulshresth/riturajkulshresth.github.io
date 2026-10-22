/**
 * Day/night switch for the vault, pinned top-right opposite the back button so
 * it is reachable from the lock screen as well as the reader. Wraps the site's
 * own toggle, so the choice carries over to every other page.
 */
import ThemeToggle from "@/app/_default/components/theme-toggle";

export default function ThemeSwitch() {
  return (
    <div className="fixed right-4 top-4 z-30 md:right-8 md:top-6">
      <ThemeToggle className="bg-[color:var(--color-bg-overlay)] backdrop-blur-md" />
    </div>
  );
}
