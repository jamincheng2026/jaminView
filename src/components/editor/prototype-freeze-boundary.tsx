"use client";

import * as React from "react";

let frozen = false;

function freezePrototypeChainOnce() {
  if (frozen) {
    return;
  }

  frozen = true;

  try {
    Object.freeze(Object.prototype);
    Object.freeze(Array.prototype);
    Object.freeze(Function.prototype);
  } catch {
    // 浏览器或环境拒绝冻结时静默忽略，主要的运行时防线仍由路径黑名单与 hasOwn 守卫承担。
  }
}

/**
 * 应用启动时冻结原型链，防止恶意 payload / 用户脚本经原型污染传染全局。
 * 仅渲染一次，无 UI 输出。
 */
export function PrototypeFreezeBoundary() {
  React.useEffect(() => {
    freezePrototypeChainOnce();
  }, []);

  return null;
}
