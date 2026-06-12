import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import UnlockOnMount from "@/components/UnlockOnMount";
import VaultConsole from "@/components/vault/VaultConsole";

export const metadata: Metadata = {
  title: "The Vault — Jafar Dabbagh",
  description:
    "A hollowed asteroid station for travelers: sign the log, choose a starter seed, grow a garden of your own.",
};

export default function VaultPage() {
  return (
    <>
      <SiteHeader current="vault" />
      <UnlockOnMount id="first-contact" />
      <main className="mx-auto max-w-4xl px-6 pb-28 pt-36 md:px-8">
        <VaultConsole />
      </main>
      <Footer />
    </>
  );
}
