import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "@/lib/api";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authModal, setAuthModal] = useState({ open: false, mode: "login", pending: null });
    const [garageIds, setGarageIds] = useState(() => new Set());

    const refreshGarage = useCallback(async () => {
        try {
            const { data } = await api.get("/garage");
            setGarageIds(new Set(data.map((it) => it.product_id)));
            return data;
        } catch {
            setGarageIds(new Set());
            return [];
        }
    }, []);

    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem("ms_token");
        if (!token) {
            setUser(null);
            setGarageIds(new Set());
            setLoading(false);
            return null;
        }
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
            refreshGarage();
            return data;
        } catch (e) {
            setAuthToken(null);
            setUser(null);
            setGarageIds(new Set());
            return null;
        } finally {
            setLoading(false);
        }
    }, [refreshGarage]);

    useEffect(() => { refreshUser(); }, [refreshUser]);

    const login = useCallback(async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        setAuthToken(data.access_token);
        setUser(data.user);
        refreshGarage();
        return data.user;
    }, [refreshGarage]);

    const register = useCallback(async (email, password, name) => {
        const { data } = await api.post("/auth/register", { email, password, name });
        setAuthToken(data.access_token);
        setUser(data.user);
        setGarageIds(new Set());
        return data.user;
    }, []);

    const logout = useCallback(() => {
        setAuthToken(null);
        setUser(null);
        setGarageIds(new Set());
    }, []);

    const updateProfile = useCallback(async (patch) => {
        const { data } = await api.put("/auth/profile", patch);
        setUser(data);
        return data;
    }, []);

    /**
     * Add a product to the user's garage and update the local membership set.
     * The caller is responsible for ensuring the user is authenticated.
     */
    const addProductToGarage = useCallback(async (productId) => {
        const { data } = await api.post("/garage", { product_id: productId });
        setGarageIds((prev) => {
            const next = new Set(prev);
            next.add(productId);
            return next;
        });
        return data;
    }, []);

    const removeProductFromGarage = useCallback((productId) => {
        setGarageIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
        });
    }, []);

    const isInGarage = useCallback((productId) => garageIds.has(productId), [garageIds]);

    const openAuth = useCallback((mode = "login", pending = null) => {
        setAuthModal({ open: true, mode, pending });
    }, []);
    const closeAuth = useCallback(() => setAuthModal((s) => ({ ...s, open: false, pending: null })), []);

    const value = useMemo(
        () => ({
            user, loading, login, register, logout, updateProfile, refreshUser,
            openAuth, closeAuth, authModal, setAuthModal,
            garageIds, isInGarage, addProductToGarage, removeProductFromGarage, refreshGarage,
        }),
        [user, loading, login, register, logout, updateProfile, refreshUser, openAuth, closeAuth, authModal, garageIds, isInGarage, addProductToGarage, removeProductFromGarage, refreshGarage]
    );
    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
};
