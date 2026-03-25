import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionProps,
  type Variants,
} from "framer-motion";

interface ScrollAnimationProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, keyof MotionProps>,
    MotionProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
}

export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  delay = 0,
  direction = "up",
  distance = 20,
  ...props
}) => {
  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? distance : direction === "down" ? -distance : 0,
      x:
        direction === "left" ? distance : direction === "right" ? -distance : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
        delay: delay,
      } as any,
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
}> = ({ children, className, delay = 0, stagger = 0.1 }) => {
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: delay,
        staggerChildren: stagger,
      } as any,
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={container}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      } as any,
    },
  };

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
};

/* ═══ PARALLAX IMAGE ═══ */

interface ParallaxImageProps {
  src: string;
  alt?: string;
  srcSet?: string;
  sizes?: string;
  speed?: number;
  className?: string;
  imgClassName?: string;
  overlay?: React.ReactNode;
  loading?: "lazy" | "eager";
}

export const ParallaxImage: React.FC<ParallaxImageProps> = ({
  src,
  alt = "",
  srcSet,
  sizes,
  speed = 0.3,
  className = "",
  imgClassName = "",
  overlay,
  loading = "lazy",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [`${-speed * 50}%`, `${speed * 50}%`],
  );

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        style={{ y }}
        className={`h-full w-full object-cover ${imgClassName}`}
        loading={loading}
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
          if (target.parentElement) {
            target.parentElement.style.backgroundColor = "#F5E6E8";
          }
        }}
      />
      {overlay}
    </div>
  );
};
