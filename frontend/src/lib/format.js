export const formatINR = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "₹ -";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value));
};

export const formatDateLong = (iso) => {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    } catch {
        return iso;
    }
};

export const formatDateShort = (iso) => {
    if (!iso) return "";
    try {
        return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch {
        return iso;
    }
};

export const truncate = (s, n) => {
    if (!s) return "";
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
};
