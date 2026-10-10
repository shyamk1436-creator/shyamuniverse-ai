module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "केवल POST अनुरोध स्वीकार हैं।"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "AI API key अभी सेट नहीं है।"
    });
  }

  try {
    const { topic, style, duration } = req.body || {};

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({
        error: "कृपया वीडियो का विषय लिखें।"
      });
    }

    const prompt = `
तुम एक अनुभवी हिंदी YouTube स्क्रिप्ट लेखक हो।
वीडियो का विषय: ${topic}
वीडियो का प्रकार: ${style || "जानकारी देने वाला"}
वीडियो की अवधि: ${duration || 5} मिनट

सरल हिंदी में मौलिक और रोचक स्क्रिप्ट लिखो।
शुरुआत आकर्षक हो, जानकारी उपयोगी हो और अंत अच्छा हो।
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: prompt }] }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(502).json({
        error: "AI से जवाब नहीं मिला। API सेटिंग जाँचें।"
      });
    }

    const script = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n");

    if (!script) {
      return res.status(502).json({
        error: "स्क्रिप्ट नहीं मिली। दोबारा कोशिश करें।"
      });
    }

    return res.status(200).json({ script });
  } catch (error) {
    console.error("Script generation error:", error);
    return res.status(500).json({
      error: "अभी स्क्रिप्ट नहीं बन पाई।"
    });
  }
};
