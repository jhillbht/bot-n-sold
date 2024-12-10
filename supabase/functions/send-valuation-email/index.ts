import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValuationData {
  monthlyRevenue: number;
  monthlyExpenses: number;
  businessType: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ValuationData = await req.json();
    const yearlyRevenue = data.monthlyRevenue * 12;
    const yearlyExpenses = data.monthlyExpenses * 12;
    const profit = yearlyRevenue - yearlyExpenses;
    
    // Simple valuation calculation (you can make this more sophisticated)
    const valuation = profit * 3; // 3x yearly profit as a simple multiplier

    const emailHtml = `
      <h1>Your Business Valuation Report</h1>
      <p>Here's a summary of your business details:</p>
      <ul>
        <li>Business Type: ${data.businessType}</li>
        <li>Monthly Revenue: $${data.monthlyRevenue.toLocaleString()}</li>
        <li>Monthly Expenses: $${data.monthlyExpenses.toLocaleString()}</li>
        <li>Yearly Profit: $${profit.toLocaleString()}</li>
      </ul>
      <h2>Estimated Valuation: $${valuation.toLocaleString()}</h2>
      <p>Note: This is a preliminary estimate based on basic financial metrics. For a more accurate valuation, please consult with a business valuation expert.</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bot & Sold <onboarding@resend.dev>",
        to: [data.email],
        subject: "Your Business Valuation Report",
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);