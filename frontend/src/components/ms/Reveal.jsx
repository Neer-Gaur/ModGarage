import React from "react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";

export const Reveal = ({ children, delay = 0, y = 24, className = "", ...rest }) => {
    const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "-60px" });
    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
            {...rest}
        >
            {children}
        </motion.div>
    );
};

export const StaggerContainer = ({ children, gap = 0.06, className = "" }) => {
    const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "-40px" });
    return (
        <motion.div
            ref={ref}
            className={className}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={{ visible: { transition: { staggerChildren: gap } } }}
        >
            {children}
        </motion.div>
    );
};

export const StaggerItem = ({ children, y = 18, className = "" }) => (
    <motion.div
        className={className}
        variants={{
            hidden: { opacity: 0, y },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
        }}
    >
        {children}
    </motion.div>
);
