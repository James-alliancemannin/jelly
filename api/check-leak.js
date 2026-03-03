export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, recaptchaToken } = req.body;

  if (!email || !recaptchaToken) {
    return res.status(400).json({ error: 'Missing email or reCAPTCHA token' });
  }

  try {
    // Verify reCAPTCHA server-side
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;

    const verifyRes = await fetch(verifyUrl);
    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      return res.status(400).json({ error: 'reCAPTCHA verification failed' });
    }

    // Call HIBP securely (key stays on server)
    const hibpKey = process.env.HIBP_API_KEY;
    const hibpUrl = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`;

    const hibpRes = await fetch(hibpUrl, {
      headers: {
        'hibp-api-key': hibpKey,
        'User-Agent': 'AspenMeridian-FreeCheck'
      }
    });

    let breaches = [];
    if (hibpRes.status === 200) {
      breaches = await hibpRes.json();
    }

    return res.status(200).json({
      success: true,
      breaches: breaches,
      count: breaches.length
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
}
