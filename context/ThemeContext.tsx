import { darkPalette, lightPalette } from "@/lib/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useEffect, useState } from "react";

export type ThemeContextValue = {
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => Promise<void>;
    palette: typeof lightPalette;
};

export const ThemeContext = createContext<ThemeContextValue>({
    isDarkMode: false,
    setIsDarkMode: async () => { },
    palette: lightPalette,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDarkMode, setIsDarkModeState] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load dark mode preference on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const saved = await AsyncStorage.getItem("darkMode");
                if (saved !== null) {
                    setIsDarkModeState(JSON.parse(saved));
                }
            } catch (e) {
                console.error("Failed to load theme preference:", e);
            } finally {
                setIsLoaded(true);
            }
        };

        loadTheme();
    }, []);

    const setIsDarkMode = async (isDark: boolean) => {
        try {
            setIsDarkModeState(isDark);
            await AsyncStorage.setItem("darkMode", JSON.stringify(isDark));
        } catch (e) {
            console.error("Failed to save theme preference:", e);
        }
    };

    if (!isLoaded) {
        return null; // Or show a splash screen
    }

    const value: ThemeContextValue = {
        isDarkMode,
        setIsDarkMode,
        palette: isDarkMode ? darkPalette : lightPalette,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
