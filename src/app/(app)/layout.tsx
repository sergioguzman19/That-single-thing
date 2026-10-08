import Link from "next/link";
import { AccountMenu } from "@/components/app/account-menu";
import { CaptureButton } from "@/components/app/capture-button";
import { BottomNav, TopNav } from "@/components/app/nav-links";
import { UmbralMark } from "@/components/brand/umbral-mark";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // El layout lee la sesión para el menú; cada página vuelve a exigirla cerca de sus datos.
  const user = await requireUser();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="That Single Thing, inicio">
            <UmbralMark className="size-7" />
            <span className="eyebrow hidden text-foreground sm:inline">That Single Thing</span>
          </Link>
          <TopNav />
          <AccountMenu email={user.email} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-36 sm:px-6 md:pb-16">{children}</main>
      <CaptureButton />
      <BottomNav />
    </div>
  );
}
