import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Services } from "@/components/services";
import { Process } from "@/components/process";
import { Portfolio } from "@/components/portfolio";
import { About } from "@/components/about";
import { ContactCta } from "@/components/contact-cta";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Services />
        <Process />
        <Portfolio />
        <About />
        <ContactCta />
      </main>
      <SiteFooter />
    </>
  );
}
