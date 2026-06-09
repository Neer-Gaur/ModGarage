import React from "react";
import { motion } from "framer-motion";

export const GearShiftTransition = ({ children, routeKey }) => (
    <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
        {children}
    </motion.div>
);
