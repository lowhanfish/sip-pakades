"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { WordReveal } from "./primitives";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  children?: React.ReactNode;
}

/**
 * Inner-page banner: ONE glass frame holding the copy on the left and the photo bleeding into
 * the right edge (soft fade into the panel) — no separate floating boxes.
 */
export function PageHero({ eyebrow, title, description, image, imageAlt = "", children }: PageHeroProps) {
  return (
    <section className="relative -mt-[68px] pt-[68px]">
      <div className="container-page relative z-10 pb-2 pt-5">
        <div className="glass-frame">
          <div className="glass-inner grid overflow-hidden lg:grid-cols-12">
            <div className="space-y-3 px-6 py-6 sm:px-8 sm:py-7 lg:col-span-8">
              <motion.span
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700"
              >
                <span className="h-px w-8 bg-orange-400" />
                {eyebrow}
              </motion.span>

              <h1 className="text-3xl leading-[1.1] text-sky-950 sm:text-4xl">
                <WordReveal text={title} delay={0.1} />
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="max-w-2xl text-[15px] leading-relaxed text-slate-700"
              >
                {description}
              </motion.p>

              {children && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.55 }}
                  className="pt-1"
                >
                  {children}
                </motion.div>
              )}
            </div>

            {image && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative hidden min-h-[180px] lg:col-span-4 lg:block"
              >
                <Image src={image} alt={imageAlt} fill sizes="420px" className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/15 to-transparent" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
