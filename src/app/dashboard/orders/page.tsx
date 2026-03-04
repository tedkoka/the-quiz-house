"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import type { Quiz } from "@/types/database";

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 font-bold text-[var(--primary)]">Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const quizIdParam = searchParams.get("quiz_id");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState(quizIdParam || "");
  const [orderType, setOrderType] = useState<"b2c" | "corporate">("b2c");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("quizzes")
      .select("*")
      .eq("published", true)
      .then(({ data }) => setQuizzes(data || []));

    supabase
      .from("orders")
      .select("*, quizzes(title)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as Record<string, unknown>[]) || []));
  }, []);

  const selectedQuizData = quizzes.find((q) => q.id === selectedQuiz);
  const totalCents = selectedQuizData
    ? selectedQuizData.price_cents * (orderType === "corporate" ? quantity : 1)
    : 0;

  const handleCreateOrder = async () => {
    if (!selectedQuiz) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        quiz_id: selectedQuiz,
        amount_cents: totalCents,
        quantity: orderType === "corporate" ? quantity : 1,
        order_type: orderType,
        status: "pending",
      })
      .select()
      .single();

    if (error || !order) {
      alert("Failed to create order");
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/orders/${order.id}/pay`, { method: "POST" });
    const data = await res.json();

    if (data.payfast_url && data.payload) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.payfast_url;
      for (const [key, value] of Object.entries(data.payload)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } else {
      alert("Failed to initiate payment");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8">Orders</h1>

      {/* New order form */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-8 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-bold mb-4">New Order</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Room</label>
            <select
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="border border-[var(--input)] rounded-2xl p-3 w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="">Select a room...</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} - R{(q.price_cents / 100).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Order Type
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setOrderType("b2c")}
                className={`px-4 py-2 rounded-2xl border-2 font-medium transition-all duration-200 ${
                  orderType === "b2c"
                    ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                    : "border-[var(--border)]"
                }`}
              >
                Individual (B2C)
              </button>
              <button
                onClick={() => setOrderType("corporate")}
                className={`px-4 py-2 rounded-2xl border-2 font-medium transition-all duration-200 ${
                  orderType === "corporate"
                    ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                    : "border-[var(--border)]"
                }`}
              >
                Corporate Package
              </button>
            </div>
          </div>

          {orderType === "corporate" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Number of Seats
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="border border-[var(--input)] rounded-2xl p-3 w-32 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
          )}

          {selectedQuizData && (
            <div className="bg-[var(--muted)] rounded-2xl p-4">
              <div className="flex justify-between">
                <span>Price per unit</span>
                <span>R{(selectedQuizData.price_cents / 100).toFixed(2)}</span>
              </div>
              {orderType === "corporate" && (
                <div className="flex justify-between">
                  <span>Quantity</span>
                  <span>{quantity}</span>
                </div>
              )}
              <div className="flex justify-between font-bold mt-2 pt-2 border-t border-[var(--border)]">
                <span>Total</span>
                <span>R{(totalCents / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleCreateOrder}
            disabled={!selectedQuiz || loading || totalCents === 0}
            className="bg-[var(--accent)] text-white px-8 py-3 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Proceed to Payment"}
          </button>
        </div>
      </div>

      {/* Order history */}
      {orders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Order History</h2>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
            <table className="w-full">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold">Room</th>
                  <th className="text-left p-4 text-sm font-semibold">Type</th>
                  <th className="text-right p-4 text-sm font-semibold">Amount</th>
                  <th className="text-right p-4 text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id as string}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="p-4">
                      {order.quizzes
                        ? (order.quizzes as { title: string }).title
                        : "Quiz"}
                    </td>
                    <td className="p-4 text-sm">{order.order_type as string}</td>
                    <td className="p-4 text-right">
                      R{((order.amount_cents as number) / 100).toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === "paid"
                            ? "bg-[var(--success-muted)] text-[var(--success)]"
                            : order.status === "cancelled"
                              ? "bg-[var(--danger-muted)] text-[var(--danger)]"
                              : "bg-[var(--accent-muted)] text-[var(--accent)]"
                        }`}
                      >
                        {order.status as string}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
