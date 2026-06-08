'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/client/auth';
import Link from 'next/link';
import { Eye, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TIER_COLORS: Record<string, string> = {
  weekly:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  monthly:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  lifetime: 'bg-emerald-500/10 text-[var(--accent)] border-emerald-500/20',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/10 text-[var(--accent)] border-emerald-500/20',
  paid:      'bg-emerald-500/10 text-[var(--accent)] border-emerald-500/20',
  PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  FAILED:    'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function OrdersPage() {
  const { email, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && email) {
      fetch(`/api/client/data?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.orders) setOrders(data.data.orders);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [email, isAuthenticated]);

  const generateInvoice = (order: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const setEmerald = () => doc.setTextColor(16, 185, 129);
    const setGray    = () => doc.setTextColor(100, 100, 100);
    const setBlack   = () => doc.setTextColor(0, 0, 0);

    doc.setFontSize(24);
    setBlack();
    doc.text('RECEIPT', 14, 20);
    doc.setFontSize(10);
    setGray();
    doc.text(`#${order.transaction_id}`, 14, 26);
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(pageWidth - 50, 14, 36, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(order.payment_status.toUpperCase(), pageWidth - 45, 20.5);
    doc.setFont('helvetica', 'normal');

    let currentY = 40;

    if (order.generated_keys && order.generated_keys.length > 0) {
      setEmerald();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Delivered Items', 14, currentY);
      currentY += 8;
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      order.generated_keys.forEach((key: string) => {
        doc.rect(14, currentY, pageWidth - 28, 12, 'F');
        doc.setDrawColor(16, 185, 129);
        doc.rect(14, currentY, pageWidth - 28, 12, 'S');
        doc.setTextColor(16, 185, 129);
        doc.setFont('courier', 'bold');
        doc.setFontSize(11);
        doc.text(key, 18, currentY + 8);
        currentY += 16;
      });
      currentY += 10;
    }

    setBlack();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Order Items', 14, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['Item', 'Type', 'Price']],
      body: [[`Seisen Hub ${order.tier} Plan`, 'Digital License', `${order.currency === 'EUR' ? '€' : '$'}${order.amount}`]],
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255] },
      bodyStyles: { textColor: [50, 50, 50] },
      styles: { fontSize: 10 },
      theme: 'grid',
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    setBlack();
    doc.text(`Total: ${order.currency === 'EUR' ? '€' : '$'}${order.amount}`, 14, currentY);
    currentY += 15;

    doc.setFontSize(14);
    setBlack();
    doc.text('Payment Information', 14, currentY);
    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    setGray();

    const addInfoRow = (label: string, value: string) => {
      doc.text(label, 14, currentY);
      setBlack();
      doc.text(value, 60, currentY);
      setGray();
      currentY += 6;
    };

    addInfoRow('Payment Status', order.payment_status.toUpperCase());
    addInfoRow('Email', order.payer_email || 'N/A');
    addInfoRow('Transaction ID', order.transaction_id);
    if (order.payer_id) addInfoRow('Payer ID', order.payer_id);
    addInfoRow('Date', new Date(order.created_at).toLocaleString());

    currentY += 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 8;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Seisen Hub - Premium Scripts & Utilities', 14, currentY);
    doc.text('Thank you for your business.', 14, currentY + 4);
    doc.save(`SeisenReceipt_${order.transaction_id}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">Your Orders</h1>
        <p className="text-sm text-[#555] mt-1">Complete purchase history.</p>
      </div>

      <div className="bg-[#0e0e0e] rounded-xl border border-[#1a1a1a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#555]">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#555]">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#555]">Package</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#555]">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#555]">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-[#555]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#131313]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-[#444] mx-auto" />
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order: any) => (
                  <tr key={order.transaction_id} className="hover:bg-[#111] transition-colors">
                    <td className="px-5 py-3.5 text-xs text-[#555] truncate max-w-[140px]">
                      {order.transaction_id}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#666] whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${TIER_COLORS[order.tier] || 'bg-[#1a1a1a] text-[#888] border-[#222]'}`}>
                        {order.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--accent)] font-bold">${order.amount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[order.payment_status] || 'bg-[#1a1a1a] text-[#888] border-[#222]'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => generateInvoice(order)}
                          className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-[#555] hover:text-white transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/client/orders/${order.transaction_id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-xs text-[#666] hover:text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#444]">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
