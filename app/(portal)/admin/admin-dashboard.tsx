"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BarChart3, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, CircleDollarSign, ClipboardList, FileBarChart, Leaf, ListChecks, Sprout, Tractor, Users, WalletCards } from "lucide-react";
import { AdminHeader, AdminSidebar, AdminSidebarBackdrop } from "./admin-chrome";

type Transaction = {
  id: string;
  farmer: string;
  owner: string;
  equipment: string;
  rental: { type: string; start: string | null; end: string | null; durationDays: number | null };
  rentalAmount: number;
  deliveryCharge: number;
  totalAmount: number;
  commission: number;
  ownerAmount: number;
  paymentStatus: string;
  payoutStatus: string;
  date: string;
};

type TrendPoint = { date: string; label: string; rentalRequests: number; successfulPayments: number; failedPayments: number; transactionValue: number };
type Overview = {
  metrics: { users: number; farmers: number; owners: number; listings: number; publishedListings: number; rentalRequests: number; paymentTransactions: number; successfulPayments: number; failedPayments: number; refundedPayments: number };
  locations: { districts: number; mandals: number; villages: number };
  grossAmount: number;
  platformCommission: number;
  ownerPayable: number;
  ownerPaid: number;
  transactionsDetail: Transaction[];
  trend: TrendPoint[];
};

type Tone = "blue" | "green" | "orange" | "purple" | "yellow" | "red";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const date = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));

function MetricCard({ icon: Icon, label, value, supporting, tone, action }: { icon: LucideIcon; label: string; value: string; supporting: string; tone: Tone; action?: boolean }) {
  return <article className={`admin-metric-card admin-tone-${tone}`}><div className="admin-metric-icon"><Icon size={21} strokeWidth={2.2} /></div><div className="admin-metric-copy"><p>{label}</p><strong>{value}</strong><span>{supporting}</span></div>{action ? <ChevronRight className="admin-metric-arrow" size={18} /> : null}</article>;
}

function StatusBadge({ value, payout = false }: { value: string; payout?: boolean }) {
  const normalized = value.toLowerCase();
  const display = payout && normalized === "created" ? "N/A" : value;
  const tone = normalized === "paid" ? "success" : normalized === "failed" ? "danger" : normalized === "refunded" ? "purple" : normalized === "pending" || normalized === "created" ? "warning" : "neutral";
  return <span className={`admin-status admin-status-${tone}`}><i />{display}</span>;
}

function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const chart = useMemo(() => {
    const width = 760; const height = 270; const left = 44; const right = 50; const top = 18; const bottom = 42; const plotWidth = width - left - right; const plotHeight = height - top - bottom;
    const maxCount = Math.max(1, ...trend.flatMap((point) => [point.rentalRequests, point.successfulPayments, point.failedPayments])); const maxAmount = Math.max(1, ...trend.map((point) => point.transactionValue));
    const x = (index: number) => left + (trend.length === 1 ? plotWidth / 2 : (index / (trend.length - 1)) * plotWidth); const yCount = (value: number) => top + plotHeight - (value / maxCount) * plotHeight; const yAmount = (value: number) => top + plotHeight - (value / maxAmount) * plotHeight;
    return { width, height, left, right, top, plotWidth, plotHeight, maxCount, maxAmount, x, yCount, yAmount };
  }, [trend]);
  const line = trend.map((point, index) => `${chart.x(index)},${chart.yAmount(point.transactionValue)}`).join(" ");
  return <div className="admin-chart-wrap"><div className="admin-chart-legend"><span><i className="legend-dot legend-success" />Successful Payments</span><span><i className="legend-dot legend-failed" />Failed Payments</span><span><i className="legend-dot legend-requests" />Rental Requests</span><span><i className="legend-line legend-value" />Transaction Value (₹)</span></div><svg className="admin-trend-chart" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Bookings and payments trend for the last seven days">{[0, 2, 4, 6, 8].map((tick) => { const y = chart.yCount(tick); return <g key={tick}><line x1={chart.left} x2={chart.width - chart.right} y1={y} y2={y} className="chart-grid" /><text x={chart.left - 10} y={y + 4} textAnchor="end" className="chart-axis-label">{tick}</text><text x={chart.width - chart.right + 10} y={y + 4} className="chart-axis-label">₹{Math.round((chart.maxAmount * tick) / 8 / 1000)}K</text></g>; })}{trend.map((point, index) => { const center = chart.x(index); const barWidth = Math.min(19, chart.plotWidth / Math.max(trend.length * 3.2, 1)); return <g key={point.date}>{[point.successfulPayments, point.failedPayments, point.rentalRequests].map((value, valueIndex) => { const barHeight = (value / chart.maxCount) * chart.plotHeight; return <rect key={valueIndex} x={center - barWidth * 1.5 + valueIndex * barWidth} y={chart.top + chart.plotHeight - barHeight} width={barWidth - 3} height={Math.max(0, barHeight)} rx="3" className={`chart-bar chart-bar-${valueIndex}`}><title>{`${point.label}: ${value}`}</title></rect>; })}<text x={center} y={chart.height - 14} textAnchor="middle" className="chart-label">{point.label}</text></g>; })}<polyline points={line} className="chart-value-line" />{trend.map((point, index) => <circle key={`${point.date}-value`} cx={chart.x(index)} cy={chart.yAmount(point.transactionValue)} r="3.5" className="chart-value-dot"><title>{`${point.label}: ${money(point.transactionValue)}`}</title></circle>)}</svg></div>;
}

export default function AdminDashboard({ adminName }: { adminName: string }) {
  const [overview, setOverview] = useState<Overview | null>(null); const [error, setError] = useState(""); const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => { let active = true; fetch("/api/admin/overview", { cache: "no-store" }).then(async (response) => { const body = (await response.json()) as Overview & { message?: string }; if (!response.ok) throw new Error(body.message ?? "Unable to load admin metrics"); if (active) setOverview(body); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load admin metrics"); }); return () => { active = false; }; }, []);
  const metrics = overview?.metrics; const userName = adminName || "MandalRent Admin";
  return <div className="admin-dashboard" id="top"><AdminSidebarBackdrop open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><AdminSidebar active="dashboard" open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><main className="admin-main"><AdminHeader title="Admin Dashboard" subtitle="Real data. Real impact. Supporting farmers and equipment owners across Andhra Pradesh." adminName={userName} locations={overview?.locations} onMenu={() => setSidebarOpen(true)} />{error ? <div className="admin-error" role="alert">{error}</div> : null}
    <section className="admin-kpi-grid" aria-label="Platform metrics"><MetricCard icon={Users} label="Total Users" value={metrics ? String(metrics.users) : "—"} supporting={metrics ? `${metrics.farmers} Farmers · ${metrics.owners} Owner · ${Math.max(0, metrics.users - metrics.farmers - metrics.owners)} Admins` : "Loading live data"} tone="blue" /><MetricCard icon={Leaf} label="Farmers" value={metrics ? String(metrics.farmers) : "—"} supporting={metrics && metrics.users ? `${Math.round((metrics.farmers / metrics.users) * 100)}% of total users` : "Registered farmers"} tone="green" /><MetricCard icon={Tractor} label="Owners" value={metrics ? String(metrics.owners) : "—"} supporting={metrics && metrics.users ? `${Math.round((metrics.owners / metrics.users) * 100)}% of total users` : "Equipment providers"} tone="orange" /><MetricCard icon={ListChecks} label="Total Listings" value={metrics ? String(metrics.listings) : "—"} supporting={metrics ? `${metrics.publishedListings} published` : "Loading live data"} tone="purple" action /><MetricCard icon={CalendarDays} label="Rental Requests" value={metrics ? String(metrics.rentalRequests) : "—"} supporting="Total requests received" tone="yellow" action /><MetricCard icon={CheckCircle2} label="Successful Payments" value={metrics ? String(metrics.successfulPayments) : "—"} supporting={metrics && metrics.paymentTransactions ? `${Math.round((metrics.successfulPayments / metrics.paymentTransactions) * 100)}% success rate` : "Completed transactions"} tone="green" action /><MetricCard icon={CircleDollarSign} label="Failed Payments" value={metrics ? String(metrics.failedPayments) : "—"} supporting={metrics && metrics.paymentTransactions ? `${Math.round((metrics.failedPayments / metrics.paymentTransactions) * 100)}% failure rate` : "Requires attention"} tone="red" action /><MetricCard icon={CircleDollarSign} label="Gross Transaction Value" value={overview ? money(overview.grossAmount) : "—"} supporting="Total payments collected" tone="purple" action /></section>
    <section className="admin-content-grid admin-content-grid-main"><article className="admin-panel admin-trend-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Platform activity</p><h2><BarChart3 size={20} />Bookings &amp; Payments Trend</h2></div><label className="admin-panel-select"><select aria-label="Trend period" defaultValue="7"><option value="7">Last 7 Days</option></select><ChevronDown size={14} /></label></div>{overview ? <TrendChart trend={overview.trend} /> : <div className="admin-loading">Loading activity trend…</div>}</article><article className="admin-panel" id="payments"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Money movement</p><h2><BarChart3 size={20} />Financial Overview</h2></div></div><div className="admin-finance-list">{[["Gross Transaction Value", overview ? money(overview.grossAmount) : "—", "green"], ["Platform Commission (10%)", overview ? money(overview.platformCommission) : "—", "blue"], ["Owner Payable", overview ? money(overview.ownerPayable) : "—", "purple"], ["Owner Paid", overview ? money(overview.ownerPaid) : "—", "orange"], ["Pending Payouts", overview ? money(overview.ownerPayable) : "—", "red"]].map(([label, value, tone]) => <div key={label} className="admin-finance-row"><span><i className={`finance-icon finance-${tone}`} />{label}</span><strong className={`finance-value-${tone}`}>{value}</strong></div>)}</div></article></section>
    <section className="admin-lower-grid"><article className="admin-panel admin-transactions-panel" id="users"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Payment ledger</p><h2><ListChecks size={20} />Recent Transactions</h2></div><button type="button" className="admin-view-all">View All <ChevronRight size={15} /></button></div><div className="admin-table-scroll">{overview?.transactionsDetail.length ? <table className="admin-table"><thead><tr>{["#", "Date", "Farmer", "Owner", "Equipment", "Rental ₹", "Delivery ₹", "Total ₹", "Commission ₹", "Owner Amount ₹", "Status", "Payout"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{overview.transactionsDetail.map((transaction, index) => <tr key={transaction.id}><td>{index + 1}</td><td className="nowrap">{date(transaction.date)}</td><td>{transaction.farmer}</td><td>{transaction.owner}</td><td><span className="admin-equipment"><Tractor size={14} />{transaction.equipment}</span></td><td className="nowrap">{money(transaction.rentalAmount)}</td><td className="nowrap">{money(transaction.deliveryCharge)}</td><td className="nowrap strong">{money(transaction.totalAmount)}</td><td className="nowrap">{money(transaction.commission)}</td><td className="nowrap">{money(transaction.ownerAmount)}</td><td><StatusBadge value={transaction.paymentStatus} /></td><td><StatusBadge value={transaction.payoutStatus} payout /></td></tr>)}</tbody></table> : <div className="admin-empty"><WalletCards size={20} />No payment transactions yet.</div>}</div></article><aside className="admin-side-panels"><article className="admin-panel" id="listings"><div className="admin-panel-heading"><h2><Leaf size={20} />Geographic Coverage</h2></div><div className="admin-coverage-grid">{([{ key: "districts", value: overview?.locations.districts ?? "—", label: "Districts" }, { key: "mandals", value: overview?.locations.mandals ?? "—", label: "Mandals" }, { key: "villages", value: overview?.locations.villages ?? "—", label: "Villages" }]).map(({ key, value, label }) => <div key={key} className={`admin-coverage-tile admin-coverage-${key}`}><strong>{value}</strong><span>{label}</span></div>)}</div></article><article className="admin-panel" id="bookings"><div className="admin-panel-heading"><h2><Sprout size={20} />Quick Actions</h2></div><div className="admin-quick-actions"><a href="#users"><Users size={17} /><span>View All Users</span><ChevronRight size={15} /></a><a href="#listings"><Tractor size={17} /><span>Manage Listings</span><ChevronRight size={15} /></a><a href="#bookings"><ClipboardList size={17} /><span>View Bookings</span><ChevronRight size={15} /></a><a href="#payments"><FileBarChart size={17} /><span>Payment Reports</span><ChevronRight size={15} /></a></div></article><article className="admin-impact-card"><Leaf size={28} /><div><strong>Empowering Andhra Pradesh Farmers</strong><span>More access to machinery. More productive farms.<br />A stronger rural economy.</span></div></article></aside></section><footer className="admin-main-footer"><Leaf size={16} /> Built for the people who keep Andhra Pradesh growing.</footer></main></div>;
}
