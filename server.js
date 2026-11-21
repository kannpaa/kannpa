
import express from "express";
import OpenAI from "openai";

const app = express();

app.use(express.json({ limit: "15mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/analyze", async (req, res) => {
  try {
    const {
      images,
      style,
      goal,
      userStyle,
      extra
    } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: "En az bir görsel gerekli."
      });
    }

    if (images.length > 5) {
      return res.status(400).json({
        error: "En fazla 5 görsel yükleyebilirsin."
      });
    }

    const imageContent = images.map((image) => {
      if (
        typeof image !== "string" ||
        !/^data:image\/(jpeg|png|webp);base64,/.test(image)
      ) {
        throw new Error("Geçersiz görsel formatı.");
      }

      return {
        type: "image_url",
        image_url: {
          url: image,
          detail: "high"
        }
      };
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Sen Vlad AI adlı kişisel mesaj asistanısın.

Görevin:
- Ekran görüntülerindeki görünür sohbeti veya profili incelemek.
- Kullanıcının yazışma tarzına uygun mesajlar önermek.
- Doğal, kısa ve samimi seçenekler üretmek.
- Karşı tarafın sınırlarına ve tercihine saygı göstermek.
- Görsellerden kişilik veya niyet hakkında kesin çıkarım yapmamak.
- Israrcı veya manipülatif mesajlar önermemek.

Beş farklı mesaj önerisi sun.
Her önerinin neden uygun olduğunu kısaca açıkla.
En doğal seçeneği ayrıca belirt.
`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
Mesaj tarzı: ${style}
Amaç: ${goal}
Kullanıcının yazışma tarzı: ${userStyle || "Doğal ve sade"}
Ek bilgi: ${extra || "Yok"}

Ekran görüntülerini incele ve öneriler oluştur.
`
            },
            ...imageContent
          ]
        }
      ],
      max_tokens: 1000
    });

    res.json({
      result: response.choices[0].message.content
    });

  } catch (error) {
    console.error("Vlad AI error:", error.message);

    res.status(500).json({
      error: "Mesaj önerileri oluşturulamadı."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Vlad AI server running on port ${PORT}`);
});
