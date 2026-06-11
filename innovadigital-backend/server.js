const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const client = new OpenAI({
  apiKey: process.env.AZURE_AI_API_KEY,
  baseURL: `${process.env.AZURE_AI_PROJECT_ENDPOINT}/openai/v1`,
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Backend de Innova Digital funcionando",
  });
});

app.post("/api/sales-agent", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        ok: false,
        error: "message es obligatorio",
      });
    }

    const response = await client.responses.create({
      model: "gpt-4o",
      input: message,
      extra_body: {
        agent_reference: {
          name: process.env.AZURE_AGENT_NAME,
          version: process.env.AZURE_AGENT_VERSION,
          type: "agent_reference",
        },
      },
    });

    return res.json({
      ok: true,
      reply: response.output_text,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

app.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: "Faltan campos: name, email, message",
      });
    }

    const mailOptions = {
      from: `"Innova Digital Web" <${process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO,
      replyTo: email,
      subject: `Nuevo mensaje desde innovadigital.uk - ${name}`,
      text: `
Nombre: ${name}
Email: ${email}

Mensaje:
${message}
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      ok: true,
      message: "Correo enviado correctamente",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});