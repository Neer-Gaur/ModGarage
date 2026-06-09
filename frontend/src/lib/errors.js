/**
 * Convert any backend error (axios error, Pydantic 422, generic) into a
 * human-readable string suitable for toast.error().
 */
export const apiError = (err, fallback = "Something went wrong. Try again.") => {
    if (!err) return fallback;
    const detail = err?.response?.data?.detail ?? err?.response?.data ?? err?.message;
    if (!detail) return fallback;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        // Pydantic validation error array
        const messages = detail.map((d) => {
            if (typeof d === "string") return d;
            const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : null;
            const msg = d?.msg || "Invalid value";
            return field ? `${String(field)}: ${msg}` : msg;
        });
        return messages.join(" \u00b7 ");
    }
    if (typeof detail === "object") {
        if (detail.msg) return String(detail.msg);
        try {
            return JSON.stringify(detail);
        } catch {
            return fallback;
        }
    }
    return String(detail) || fallback;
};
