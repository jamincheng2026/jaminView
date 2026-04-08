import { WidgetPackage, WidgetCategory } from './types';

/**
 * 组件大管家 (Widget Registry)
 * 负责收集、注册、以及分配 packages 目录下的所有独立组件（五件套）
 */
class WidgetRegistry {
  private packages: Map<string, WidgetPackage> = new Map();

  /** 注册插件包 */
  public register(pkg: WidgetPackage) {
    const key = pkg.registration.key;
    if (this.packages.has(key)) {
      console.warn(`[Registry] 组件包 ${key} 已存在，忽略覆盖注册。`);
      return;
    }
    this.packages.set(key, pkg);
  }

  /** 获取单个插件包 */
  public getPackage(key: string): WidgetPackage | undefined {
    return this.packages.get(key);
  }

  /**
   * 按类别获取所有组件包 (左侧物料栏渲染使用)
   */
  public getPackagesByCategory(): Record<WidgetCategory, WidgetPackage[]> {
    const grouped = {} as Record<WidgetCategory, WidgetPackage[]>;
    
    // 初始化所有分类的空数组
    Object.values(WidgetCategory).forEach((cat) => {
      grouped[cat as WidgetCategory] = [];
    });

    // 填充分组
    this.packages.forEach((pkg) => {
      if (grouped[pkg.registration.category]) {
        grouped[pkg.registration.category].push(pkg);
      }
    });

    return grouped;
  }

  /** 通用获取所有的 key */
  public getAllKeys(): string[] {
    return Array.from(this.packages.keys());
  }
}

// 导出全局单例
export const registry = new WidgetRegistry();
