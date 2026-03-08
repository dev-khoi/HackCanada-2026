import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Listing } from "../types/listing";

export interface SavedItem {
    listing: Listing;
    savedAt: number;
    boardId: string;
}

export interface Board {
    id: string;
    name: string;
}

interface SavesContextValue {
    saved: SavedItem[];
    boards: Board[];
    save: (listing: Listing, boardId?: string) => void;
    unsave: (listingId: string) => void;
    isSaved: (listingId: string) => boolean;
    createBoard: (name: string) => Board;
    deleteBoard: (boardId: string) => void;
    getSavedByBoard: (boardId: string) => SavedItem[];
    savedCount: number;
}

const SavesContext = createContext<SavesContextValue | null>(null);

function getStorageKey(userId: string) {
    return userId ? `maison-ore-saves-${userId}` : "maison-ore-saves";
}

const DEFAULT_BOARD: Board = { id: "all", name: "All Saves" };

function loadSaves(userId: string): { saved: SavedItem[]; boards: Board[] } {
    try {
        const raw = localStorage.getItem(getStorageKey(userId));
        if (!raw) return { saved: [], boards: [DEFAULT_BOARD] };
        const parsed = JSON.parse(raw);
        return {
            saved: parsed.saved || [],
            boards: parsed.boards?.length ? parsed.boards : [DEFAULT_BOARD],
        };
    } catch {
        return { saved: [], boards: [DEFAULT_BOARD] };
    }
}

function persist(userId: string, saved: SavedItem[], boards: Board[]) {
    localStorage.setItem(getStorageKey(userId), JSON.stringify({ saved, boards }));
}

export function SavesProvider({ userId = "", children }: { userId?: string; children: ReactNode }) {
    const [data, setData] = useState(() => loadSaves(userId));

    // Re-load when user changes (login/logout/switch)
    useEffect(() => {
        setData(loadSaves(userId));
    }, [userId]);

    useEffect(() => {
        persist(userId, data.saved, data.boards);
    }, [data, userId]);

    const save = useCallback((listing: Listing, boardId = "all") => {
        setData((prev) => {
            if (prev.saved.some((s) => s.listing._id === listing._id)) return prev;
            return {
                ...prev,
                saved: [...prev.saved, { listing, savedAt: Date.now(), boardId }],
            };
        });
    }, []);

    const unsave = useCallback((listingId: string) => {
        setData((prev) => ({
            ...prev,
            saved: prev.saved.filter((s) => s.listing._id !== listingId),
        }));
    }, []);

    const isSaved = useCallback(
        (listingId: string) => data.saved.some((s) => s.listing._id === listingId),
        [data.saved]
    );

    const createBoard = useCallback((name: string): Board => {
        const board: Board = { id: `board-${Date.now()}`, name };
        setData((prev) => ({ ...prev, boards: [...prev.boards, board] }));
        return board;
    }, []);

    const deleteBoard = useCallback((boardId: string) => {
        if (boardId === "all") return;
        setData((prev) => ({
            boards: prev.boards.filter((b) => b.id !== boardId),
            saved: prev.saved.map((s) =>
                s.boardId === boardId ? { ...s, boardId: "all" } : s
            ),
        }));
    }, []);

    const getSavedByBoard = useCallback(
        (boardId: string) =>
            boardId === "all"
                ? data.saved
                : data.saved.filter((s) => s.boardId === boardId),
        [data.saved]
    );

    return (
        <SavesContext.Provider
            value={{
                saved: data.saved,
                boards: data.boards,
                save,
                unsave,
                isSaved,
                createBoard,
                deleteBoard,
                getSavedByBoard,
                savedCount: data.saved.length,
            }}
        >
            {children}
        </SavesContext.Provider>
    );
}

export function useSaves() {
    const ctx = useContext(SavesContext);
    if (!ctx) throw new Error("useSaves must be used within SavesProvider");
    return ctx;
}
