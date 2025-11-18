import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

export default function MatchmakerFilter({ onFilterChange }) {
    const [filters, setFilters] = useState({
        gender: 'all',
        age_range: 'all',
        city: '',
        keyword: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onFilterChange(filters);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 mb-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                    type="text"
                    name="keyword"
                    value={filters.keyword}
                    onChange={handleChange}
                    placeholder="Search by keyword..."
                    className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <select
                    name="gender"
                    value={filters.gender}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="all">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="undisclosed">Undisclosed</option>
                </select>
                <select
                    name="age_range"
                    value={filters.age_range}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="all">All Ages</option>
                    <option value="18-22">18-22</option>
                    <option value="23-27">23-27</option>
                    <option value="28+">28+</option>
                </select>
                <input
                    type="text"
                    name="city"
                    value={filters.city}
                    onChange={handleChange}
                    placeholder="Filter by city..."
                    className="md:col-span-3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                    type="submit"
                    className="md:col-span-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <SlidersHorizontal className="w-5 h-5 mr-2" />
                    Filter
                </button>
            </div>
        </form>
    );
}