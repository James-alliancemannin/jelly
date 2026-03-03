// api/check-leak.js  (Vercel Serverless Function - CommonJS)
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { email, recaptchaToken } = req.body || {};

    if (!email || !recaptchaToken) {
      return res.status(400).json({ success: false, error: "Missing email or reCAPTCHA token" });
    }

    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (!recaptchaSecret) {
      return res.status(500).json({ success: false, error: "Missing RECAPTCHA_SECRET_KEY on server" });
    }

    // Verify reCAPTCHA (use POST form body; more reliable than querystring GET)
    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: recaptchaSecret, response: recaptchaToken }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return res.status(403).json({
        success: false,
        error: "reCAPTCHA verification failed",
        details: verifyData["error-codes"] || [],
      });
    }

    const hibpKey = process.env.HIBP_API_KEY;
    if (!hibpKey) {
      return res.status(500).json({ success: false, error: "Missing HIBP_API_KEY on server" });
    }

    // HIBP breachedaccount:
    // - 404 means "no breaches"
    // - must send a User-Agent
    const hibpUrl =
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;

    const hibpRes = await fetch(hibpUrl, {
      method: "GET",
      headers: {
        "hibp-api-key": hibpKey,
        "user-agent": "AspenMeridian-FreeCheck (aspenmeridian.com)",
        "accept": "application/json",
      },
    });

    if (hibpRes.status === 404) {
      return res.status(200).json({ success: true, breaches: [], count: 0 });
    }

    if (!hibpRes.ok) {
      const txt = await hibpRes.text();
      return res.status(hibpRes.status).json({
        success: false,
        error: `HIBP error (${hibpRes.status})`,
        details: txt.slice(0, 400),
      });
    }

    const breaches = await hibpRes.json();
    return res.status(200).json({
      success: true,
      breaches: Array.isArray(breaches) ? breaches : [],
      count: Array.isArray(breaches) ? breaches.length : 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Server error", details: String(error?.message || error) });
  }
};
