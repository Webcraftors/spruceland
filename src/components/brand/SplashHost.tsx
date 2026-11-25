import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import bg from "@/assets/brand/splash_scales_bg.png.asset.json";
import stgl from "@/assets/brand/stgl_logo_square.png.asset.json";
import yalelo from "@/assets/brand/yalelo_logo.png.asset.json";
import { appFlavor } from "@/lib/push/native";

export type SplashBrand = "stgl" | "yalelo";
export interface SplashOptions { name?: string; subtitle?: string; brand?: SplashBrand }

/** Minimum time the loading screen stays up, per brand requirement. */
export const SPLASH_MIN_MS = 5000;
const EVT = "spruceland:splash";

/** Shows the branded loading screen; resolves once the bar reaches 100%. */
export function runSplash(opts: SplashOptions = {}): Promise<void> {
  return new Promise(resolve => {
    window.dispatchEvent(new CustomEvent(EVT, { detail: { ...opts, resolve } }));
  });
}

export function brandForApp(): SplashBrand {
  return appFlavor() === "yalelo" ? "yalelo" : "stgl";
}

export function SplashHost() {
  const [active, setActive] = useState<(SplashOptions & { resolve: () => void }) | null>(null);
  const [pct, setPct] = useState(0);
  const [welcome, setWelcome] = useState<SplashOptions | null>(null);
  const raf = useRef(0);

  useEffect(() => {
    const on = (e: Event) => { setPct(0); setActive((e as CustomEvent).detail); };
    window.addEventListener(EVT, on);
    // Phone apps show the splash every time they open.
    if (appFlavor() !== "web" && !sessionStorage.getItem("spruceland.splashShown")) {
      sessionStorage.setItem("spruceland.splashShown", "1");
      setActive({ brand: brandForApp(), resolve: () => {} });
      void import("@capacitor/splash-screen").then(m => m.SplashScreen.hide()).catch(() => {});
    }
    return () => window.removeEventListener(EVT, on);
  }, []);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(100, ((t - start) / SPLASH_MIN_MS) * 100);
      setPct(p);
      if (p < 100) raf.current = requestAnimationFrame(tick);
      else setTimeout(() => {
        active.resolve();
        if (active.name) setWelcome(active);
        setActive(null);
      }, 250);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);

  const brand = active?.brand ?? "stgl";
  return (
    <>
      {active && (
        <div role="status" aria-label="Loading" className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background bg-cover bg-bottom px-8 animate-in fade-in"
          style={{ backgroundImage: `url(${bg.url})` }}>
          <div className="flex items-center gap-4">
            {brand === "yalelo" && <img src={yalelo.url} alt="Yalelo" className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl shadow-lg" />}
            <img src={stgl.url} alt="Spruceland Technologies" className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl shadow-lg" />
          </div>
          <p className="mt-6 text-sm font-semibold text-foreground">{brand === "yalelo" ? "Yalelo × Spruceland" : "Spruceland IQ"}</p>
          <p className="text-xs text-muted-foreground">{active.subtitle ?? "Preparing your workspace…"}</p>
          <div className="mt-6 w-full max-w-xs">
            <Progress value={pct} className="h-2" />
            <p className="mt-2 text-center text-xs font-semibold tabular-nums text-primary">{Math.round(pct)}%</p>
          </div>
        </div>
      )}
      <Dialog open={!!welcome} onOpenChange={o => !o && setWelcome(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="flex gap-2 justify-center">
              {welcome?.brand === "yalelo" && <img src={yalelo.url} alt="" className="h-12 w-12 rounded-xl" />}
              <img src={stgl.url} alt="" className="h-12 w-12 rounded-xl" />
            </div>
            <DialogTitle className="pt-2">Welcome, {welcome?.name?.split(" ")[0]}!</DialogTitle>
            <DialogDescription>{welcome?.subtitle ?? "You're signed in and ready to go."}</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button className="w-full" onClick={() => setWelcome(null)}>Get started</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
