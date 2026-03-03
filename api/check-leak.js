module.exports = async (req, res) => {

  // ---- CORS ----
  res.setHeader("Access-Control-Allow-Origin", "https://aspenmeridian.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { email, recaptchaToken } = req.body || {};

    if (!email || !recaptchaToken) {
      return res.status(400).json({
        success: false,
        error: "Missing email or reCAPTCHA token"
      });
    }

    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    const hibpKey = process.env.HIBP_API_KEY;

    if (!recaptchaSecret) {
      return res.status(500).json({
        success: false,
        error: "Server misconfiguration: RECAPTCHA_SECRET_KEY missing"
      });
    }

    if (!hibpKey) {
      return res.status(500).json({
        success: false,
        error: "Server misconfiguration: HIBP_API_KEY missing"
      });
    }

    // ---- Verify reCAPTCHA ----
    const verifyRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: recaptchaSecret,
          response: recaptchaToken
        })
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      return res.status(403).json({
        success: false,
        error: "reCAPTCHA verification failed",
        details: verifyData["error-codes"] || []
      });
    }

    // ---- Query Have I Been Pwned ----
    const hibpUrl =
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;

    const hibpRes = await fetch(hibpUrl, {
      method: "GET",
      headers: {
        "hibp-api-key": hibpKey,
        "user-agent": "AspenMeridian-FreeCheck (aspenmeridian.com)",
        "accept": "application/json"
      }
    });

    // 404 = no breaches (normal case)
    if (hibpRes.status === 404) {
      return res.status(200).json({
        success: true,
        breaches: [],
        count: 0
      });
    }

    if (!hibpRes.ok) {
      const errorText = await hibpRes.text();
      return res.status(hibpRes.status).json({
        success: false,
        error: `HIBP error (${hibpRes.status})`,
        details: errorText.slice(0, 400)
      });
    }

    const breaches = await hibpRes.json();

    return res.status(200).json({
      success: true,
      breaches: Array.isArray(breaches) ? breaches : [],
      count: Array.isArray(breaches) ? breaches.length : 0
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: String(error?.message || error)
    });
  }
};
