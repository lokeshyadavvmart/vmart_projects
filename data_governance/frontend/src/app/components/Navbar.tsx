'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLink {
    href: string;
    label: string;
}

interface NavDropdown {
    label: string;
    items: NavLink[];
}

type NavItem = { type: 'link' } & NavLink | { type: 'dropdown' } & NavDropdown;

const navItems: NavItem[] = [
    {
        type: 'dropdown',
        label: 'Functional Rules',
        items: [
            { href: '/processes/duplicate_items', label: 'Duplicate Items' },
            { href: '/processes/color_variants', label: 'Color Variants' },
            { href: '/processes/same_style_diff_design', label: 'Same Style Diff Design' },
        ],
    },
    {
        type: 'dropdown',
        label: 'Data Anomaly Detection',
        items: [
            { href: '/anomaly_finder/fuzzy', label: 'Fuzzy Matching' },
            { href: '/anomaly_finder/regex', label: 'Regex Pattern' },
        ],
    },
];

export const Navbar: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pathname = usePathname();

    const handleDropdownEnter = (label: string) => {
        if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        setOpenDropdown(label);
    };

    const handleDropdownLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setOpenDropdown(null);
        }, 150);
    };

    useEffect(() => {
        return () => {
            if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        };
    }, []);

    const isDropdownActive = (items: NavLink[]) => items.some(item => pathname === item.href);

    return (
        <nav className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center space-x-2 group">
                            <svg
                                className="w-8 h-8 text-blue-400 transition-transform group-hover:scale-110 duration-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                                suppressHydrationWarning
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                                Data Governance
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-1">
                            {navItems.map((item) => {
                                if (item.type === 'link') {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive
                                                ? 'bg-blue-700 text-white shadow-md'
                                                : 'text-gray-300 hover:bg-blue-800/70 hover:text-white hover:shadow-sm'
                                                }`}
                                            suppressHydrationWarning
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                } else {
                                    const isActive = isDropdownActive(item.items);
                                    return (
                                        <div
                                            key={item.label}
                                            className="relative"
                                            onMouseEnter={() => handleDropdownEnter(item.label)}
                                            onMouseLeave={handleDropdownLeave}
                                        >
                                            <button
                                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1 ${isActive || openDropdown === item.label
                                                    ? 'bg-blue-700 text-white shadow-md'
                                                    : 'text-gray-300 hover:bg-blue-800/70 hover:text-white hover:shadow-sm'
                                                    }`}
                                                suppressHydrationWarning
                                            >
                                                {item.label}
                                                <svg
                                                    className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''
                                                        }`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    suppressHydrationWarning
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {openDropdown === item.label && (
                                                <div
                                                    className="absolute left-0 mt-2 w-56 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200/50 py-2 animate-in fade-in slide-in-from-top-2 duration-200"
                                                    onMouseEnter={() => handleDropdownEnter(item.label)}
                                                    onMouseLeave={handleDropdownLeave}
                                                >
                                                    {item.items.map((subItem) => {
                                                        const isSubActive = pathname === subItem.href;
                                                        return (
                                                            <Link
                                                                key={subItem.href}
                                                                href={subItem.href}
                                                                className={`block px-4 py-2 text-sm transition-colors ${isSubActive
                                                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                                                    : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                                onClick={() => setOpenDropdown(null)}
                                                                suppressHydrationWarning
                                                            >
                                                                {subItem.label}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-all"
                            suppressHydrationWarning
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMobileMenuOpen ? (
                                <svg className="block h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gradient-to-r from-gray-800 to-blue-900">
                        {navItems.map((item) => {
                            if (item.type === 'link') {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`block px-3 py-2 rounded-md text-base font-medium ${isActive
                                            ? 'bg-blue-700 text-white'
                                            : 'text-gray-300 hover:bg-blue-800 hover:text-white'
                                            }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        suppressHydrationWarning
                                    >
                                        {item.label}
                                    </Link>
                                );
                            } else {
                                return (
                                    <div key={item.label} className="space-y-1">
                                        <div className="px-3 py-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                                            {item.label}
                                        </div>
                                        {item.items.map((subItem) => {
                                            const isSubActive = pathname === subItem.href;
                                            return (
                                                <Link
                                                    key={subItem.href}
                                                    href={subItem.href}
                                                    className={`block px-3 py-2 pl-6 rounded-md text-base font-medium ${isSubActive
                                                        ? 'bg-blue-700 text-white'
                                                        : 'text-gray-300 hover:bg-blue-800 hover:text-white'
                                                        }`}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    suppressHydrationWarning
                                                >
                                                    {subItem.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
};