"use client";

import {useEffect, useRef} from "react";
import type {ElementType, ReactNode} from "react";

type RevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function Reveal({
  as: Component = "div",
  children,
  className,
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    node.classList.add("reveal-block--pending");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("reveal-block--visible");
          observer.disconnect();
        }
      },
      {threshold: 0.18, rootMargin: "0px 0px -8% 0px"},
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      className={`${className ?? ""} reveal-block`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Component>
  );
}
