import { horizontalBarWidgetPackage } from "./charts/bar-horizontal";
import { barWidgetPackage } from "./charts/bar";
import { lineWidgetPackage } from "./charts/line";
import { pieWidgetPackage } from "./charts/pie";
import { radarWidgetPackage } from "./charts/radar";
import { scatterWidgetPackage } from "./charts/scatter";
import { clockSystemWidgetPackage } from "./decorates/clock-system";
import { flipperNumberWidgetPackage } from "./decorates/flipper-number";
import { amapLocaMapWidgetPackage } from "./maps/amap-loca";
import { chinaGlMapWidgetPackage } from "./maps/china-gl";
import { imageFrameWidgetPackage } from "./media/image-frame";
import { scrollBoardWidgetPackage } from "./tables/scroll-board";
import { WidgetCategory, type WidgetPackage } from "./types";

const builtinPackages: WidgetPackage[] = [
  barWidgetPackage,
  lineWidgetPackage,
  pieWidgetPackage,
  horizontalBarWidgetPackage,
  scatterWidgetPackage,
  radarWidgetPackage,
  amapLocaMapWidgetPackage,
  chinaGlMapWidgetPackage,
  flipperNumberWidgetPackage,
  clockSystemWidgetPackage,
  scrollBoardWidgetPackage,
  imageFrameWidgetPackage,
];

class WidgetRegistry {
  private packages = new Map<string, WidgetPackage>();
  private initialized = false;

  private ensureInitialized() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    builtinPackages.forEach((pkg) => this.register(pkg));
  }

  public register(pkg: WidgetPackage) {
    const key = pkg.registration.key;
    if (this.packages.has(key)) {
      return;
    }

    this.packages.set(key, pkg);
  }

  public getPackage(key: string) {
    this.ensureInitialized();
    return this.packages.get(key);
  }

  public getPackagesByCategory(): Record<WidgetCategory, WidgetPackage[]> {
    this.ensureInitialized();

    const grouped = {} as Record<WidgetCategory, WidgetPackage[]>;
    Object.values(WidgetCategory).forEach((category) => {
      grouped[category] = [];
    });

    this.packages.forEach((pkg) => {
      grouped[pkg.registration.category].push(pkg);
    });

    return grouped;
  }

  public getAllKeys() {
    this.ensureInitialized();
    return Array.from(this.packages.keys());
  }
}

export const registry = new WidgetRegistry();
