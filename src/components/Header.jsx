import React from "react";
import { Link } from "react-router-dom";
import { Sun, Moon } from "lucide-react";

export default function Header({ theme, setTheme }) {
    const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow dark:bg-gray-800">
        <Link
        to="/"
        className="text-2xl font-bold text-blue-600 dark:text-blue-400"
        >
        MMU Confessions
        </Link>

        <div className="flex items-center gap-4">
        <Link
            to="/admin"
            className="text-sm font-medium text-gray-600 hover:underline dark:text-gray-300"
        >
            Admin
        </Link>
        
        <button
            aria-label="Toggle Theme"
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        </div>
    </header>
    );
}