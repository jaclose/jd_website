"use client";
import Image from "next/image";
import { motion } from "framer-motion";

const LINE = "Chasing truth in struggle and stillness.";

/**
 * The brand moment — the system has collapsed into the bar, and the
 * first thing on solid ground is the mark and the sentence the whole
 * site lives by.
 */
export default function Statement() {
  const words = LINE.split(" ");
  return (
    <section className="relative flex min-h-[88vh] items-center justify-center px-6 py-32 text-center">
      <div className="max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex justify-center"
        >
          <Image
            src="/brand/mark.png"
            alt="DabbaghMed — the mark"
            width={64}
            height={64}
            className="h-16 w-16"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, delay: 0.25 }}
          className="label mb-8 !text-[10px] text-starlight/70"
        >
          DABBAGHMED · EST. 2025
        </motion.p>

        <h2 className="font-display text-[clamp(2.2rem,6vw,4.8rem)] font-light leading-[1.12] text-ink">
          {words.map((w, i) => (
            <motion.span
              key={i}
              className="inline-block whitespace-pre"
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.9,
                delay: 0.35 + i * 0.09,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {w}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          ))}
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-10 max-w-xl font-serif text-xl italic leading-relaxed text-faint"
        >
          I’m a medical student learning that healing begins long before
          diagnosis. This space gathers my reflections on growth, faith, and
          the human anatomy of resilience.
        </motion.p>
      </div>
    </section>
  );
}
