"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, DollarSign, History, Menu, Settings, TrendingUp, X } from "lucide-react";

interface SidebarProps {
	currentPage: string;
	onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
	const [isOpen, setIsOpen] = useState(true);
	const menuItems = [
		{ id: "send", label: "Send Money", icon: ArrowUpRight },
		{ id: "receive", label: "Receive Money", icon: ArrowDownLeft },
		{ id: "withdraw", label: "Withdraw", icon: DollarSign },
		{ id: "transactions", label: "Transactions", icon: History },
		{ id: "analytics", label: "Analytics", icon: TrendingUp },
	];

	return (
		<>
			{/* Mobile Toggle */}
			<button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50 rounded-lg border border-border bg-card p-2 lg:hidden">
				{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
			</button>

			{/* Sidebar */}
			<aside
				className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:static lg:inset-y-0 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
			>
				{/* Logo */}
				<div className="border-b border-border p-6">
					<div className="flex items-center gap-3">
						<Image src="/logo.png" alt="SabaHub" width={40} height={40} className="rounded-xl object-cover shadow-sm" style={{ width: "auto", height: "auto" }} priority />
						<div>
							<h1 className="font-semibold">SabaHub</h1>
							<p className="text-xs text-muted-foreground">Digital Wallet</p>
						</div>
					</div>
				</div>

				{/* Navigation */}
				<nav className="flex-1 space-y-1 p-4">
					{menuItems.map((item) => {
						const Icon = item.icon;
						const isActive = currentPage === item.id;

						return (
							<button
								key={item.id}
								onClick={() => {
									onNavigate(item.id);
									setIsOpen(false);
								}}
								className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-all ${isActive ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
							>
								<Icon className="h-5 w-5" />
								<span>{item.label}</span>
							</button>
						);
					})}
				</nav>

				{/* Settings */}
				<div className="border-t border-border p-4">
					<button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
						<Settings className="h-5 w-5" />
						<span>Settings</span>
					</button>
				</div>
			</aside>

			{/* Overlay */}
			{isOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />}
		</>
	);
}
