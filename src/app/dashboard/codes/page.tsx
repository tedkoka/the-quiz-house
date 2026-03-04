"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface OrderWithCodes {
  id: string;
  quiz_id: string;
  quiz_title: string;
  quantity: number;
  status: string;
  codes_used: number;
  codes_total: number;
}

export default function CodesPage() {
  const [orders, setOrders] = useState<OrderWithCodes[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadOrders = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("orders")
        .select("*, quizzes(title)")
        .eq("user_id", user.id)
        .eq("order_type", "corporate")
        .eq("status", "paid")
        .order("created_at", { ascending: false });

      if (data) {
        const mapped = await Promise.all(
          data.map(async (order) => {
            const { count: total } = await supabase
              .from("redeem_codes")
              .select("*", { count: "exact", head: true })
              .eq("order_id", order.id);

            const { count: used } = await supabase
              .from("redeem_codes")
              .select("*", { count: "exact", head: true })
              .eq("order_id", order.id)
              .not("used_by", "is", null);

            return {
              id: order.id,
              quiz_id: order.quiz_id,
              quiz_title: (order as Record<string, unknown>).quizzes
                ? ((order as Record<string, unknown>).quizzes as { title: string }).title
                : "Quiz",
              quantity: order.quantity,
              status: order.status,
              codes_used: used || 0,
              codes_total: total || 0,
            };
          })
        );
        setOrders(mapped);
      }
      setLoading(false);
    };

    loadOrders();
  }, []);

  if (loading) {
    return <div className="text-center py-16 font-bold text-[var(--primary)]">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8">Corporate Codes</h1>

      {orders.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">
          No corporate orders yet. Purchase a corporate package to get redeem
          codes.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{order.quiz_title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {order.codes_used}/{order.codes_total} codes redeemed
                  </p>
                </div>
                <a
                  href={`/api/codes/generate?order_id=${order.id}`}
                  className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Download CSV
                </a>
              </div>
              <div className="mt-4 w-full bg-[var(--progress-track)] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] h-2 rounded-full"
                  style={{
                    width: `${
                      order.codes_total > 0
                        ? (order.codes_used / order.codes_total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
