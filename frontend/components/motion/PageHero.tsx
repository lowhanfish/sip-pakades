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

/** Shared sky-blue banner for inner public pages (sits under the transparent header). */
export function PageHero({ eyebrow, title, description, image, imageAlt = "", children }: PageHeroProps) {
  return (
    <section className="hero-band film-grain relative -mt-[68px] overflow-hidden pt-[68px]">
      <div className="relative z-10 container-page grid grid-cols-1 items-center gap-10 pb-20 pt-12 lg:grid-cols-12 lg:pb-24 lg:pt-16">
        <div className="lg:col-span-7">
         <div className="glass-frame">
         <div className="glass-inner space-y-3.5 px-6 py-6 sm:px-8 sm:py-7">
          <motion.span
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700"
          >
            <span className="h-px w-8 bg-orange-400" />
            {eyebrow}
          </motion.span>

          <h1 className="text-3xl leading-[1.1] text-sky-950 sm:text-4xl lg:text-[2.6rem]">
            <WordReveal text={title} delay={0.1} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="max-w-2xl text-base leading-relaxed text-slate-700 sm:text-[15px]"
          >
            {description}
          </motion.p>

          {children && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="pt-2"
            >
              {children}
            </motion.div>
          )}
         </div>
         </div>
        </div>

        {image && (
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:col-span-5 lg:block"
          >
            <div className="glass-frame mx-auto max-w-xs">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem]">
                <Image src={image} alt={imageAlt} fill sizes="440px" className="object-cover" priority />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
