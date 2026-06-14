import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

// Standard random ID generator
const generateUniqueId = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Initialize Gemini Client
const initGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Gemini features will fail.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const ai = initGeminiClient();

// Local Database Fallback Logic
interface CodeSnippet {
  id: string;
  code: string;
  language: string;
  title?: string;
  createdAt: string;
  expiresAt: string;
  parentCodeId?: string;
  rootCodeId?: string;
  isLocalFallback?: boolean;
  tags?: string[];
  ownerId?: string;
  ownerName?: string;
}

const LOCAL_DB_PATH = path.join(process.cwd(), "database.json");

const getLocalSnippets = (): Record<string, CodeSnippet> => {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf-8"));
  } catch (e) {
    return {};
  }
};

const saveLocalSnippet = (snippet: CodeSnippet) => {
  const snippets = getLocalSnippets();
  snippets[snippet.id] = snippet;
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(snippets, null, 2), "utf-8");
};

async function findSnippetById(id: string): Promise<CodeSnippet | null> {
  const hasFirebase = await initFirebase();
  if (hasFirebase && firebaseDb) {
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const docRef = doc(firebaseDb, "snippets", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as CodeSnippet;
      }
    } catch (e) {
      console.error("Firebase read failed inside findSnippetById:", e);
    }
  }
  const snippets = getLocalSnippets();
  return snippets[id] || null;
}

// Lazy Firebase Setup on Server Side
let firebaseDb: any = null;
let isFirebaseActive = false;

const initFirebase = async () => {
  if (isFirebaseActive) return true;
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    try {
      const { initializeApp } = await import("firebase/app");
      const { getFirestore } = await import("firebase/firestore");
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      
      const app = initializeApp(firebaseConfig);
      firebaseDb = getFirestore(app);
      isFirebaseActive = true;
      console.log("Firebase Firestore loaded successfully from firebase-applet-config.json.");
      return true;
    } catch (e) {
      console.error("Failed to initialize Firebase client from config file, using local database fallback.", e);
    }
  }
  return false;
};

// Start setting up Express App
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Run initial Firebase initialization attempt
  await initFirebase();

  // API 1: Auto-Correct Code with Gemini
  app.post("/api/correct", async (req, res) => {
    const { code, language, geminiApiKey } = req.body;
    const clientApiKey = req.headers["x-gemini-api-key"] || geminiApiKey;

    if (!code || !language) {
      return res.status(400).json({ error: "Code and Language are required in body." });
    }

    if (!clientApiKey) {
      return res.status(400).json({
        error: "Clé API Gemini d'utilisateur requise. Veuillez être connecté et avoir configuré votre propre clé API Gemini dans votre espace utilisateur pour utiliser les fonctionnalités d'assistance IA.",
      });
    }

    try {
      const userAi = new GoogleGenAI({
        apiKey: String(clientApiKey).trim(),
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await userAi.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Review the following ${language} code. Analyze potential runtime bugs, styling issues, vulnerabilities, and write a detailed French correction of this code:

Code :
\`\`\`${language}
${code}
\`\`\``,
        config: {
          systemInstruction: "You are an expert full-stack developer and professional code reviewer. Give friendly feedback in French. Suggest code modifications. Output JSON according to the requested schema. Return the completely fixed code in 'correctedCode'. Make sure correctionsList is complete and direct.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              success: { type: Type.BOOLEAN },
              originalExplanation: { 
                type: Type.STRING, 
                description: "Une explication humaine robuste, aimable et claire en français des problèmes identifiés dans le code fourni." 
              },
              correctedCode: { 
                type: Type.STRING, 
                description: "Le code complet et bien structuré avec l'ensemble des corrections appliquées." 
              },
              correctionsList: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Liste des changements précis effectués pour corriger le code (en français, max 5-6 points)."
              }
            },
            required: ["success", "originalExplanation", "correctedCode", "correctionsList"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text received from Gemini.");
      }

      const results = JSON.parse(text);
      return res.json(results);
    } catch (error: any) {
      console.error("Gemini Code Correction Error:", error);
      const errMsg = error.message || String(error);

      // Check for rate limits / quota issues
      if (
        errMsg.includes("RESOURCE_EXHAUSTED") || 
        error.status === 429 || 
        errMsg.includes("limit") || 
        errMsg.includes("quota") || 
        errMsg.includes("429")
      ) {
        return res.status(429).json({
          error: "Limite de quota ou de taux atteinte pour votre clé API Gemini. Veuillez patienter selon les spécifications de votre compte Gemini (généralement 1 minute d'attente pour le niveau gratuit de Gemini) avant de soumettre une nouvelle demande d'aide.",
        });
      }

      // Check for invalid keys
      if (
        errMsg.includes("API_KEY_INVALID") || 
        error.status === 400 && errMsg.includes("key") ||
        errMsg.includes("key is invalid")
      ) {
        return res.status(400).json({
          error: "Votre clé API Gemini personnelle est invalide ou non reconnue par l'API de Google. Veuillez la vérifier et la corriger dans vos paramètres.",
        });
      }

      return res.status(500).json({
        error: "Erreur lors de l'analyse du code par Gemini AI avec votre clé : " + errMsg,
      });
    }
  });

  // API 2: Share Code with Community
  app.post("/api/share", async (req, res) => {
    const { code, language, title, parentCodeId, tags, ownerId, ownerName } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "Le code et le langage sont requis." });
    }

    // Sanitize and validate tags
    let processedTags: string[] = [];
    if (tags && Array.isArray(tags)) {
      processedTags = tags
        .map((t: any) => String(t).trim())
        .filter((t: string) => t.length > 0 && t.length <= 50)
        .slice(0, 10);
    }

    // Resolve version lineage details
    let rootCodeId: string | undefined = undefined;
    if (parentCodeId) {
      try {
        const parentSnip = await findSnippetById(parentCodeId);
        if (parentSnip) {
          rootCodeId = parentSnip.rootCodeId || parentSnip.id;
        } else {
          rootCodeId = parentCodeId;
        }
      } catch (err) {
        console.warn("Failed to find parent for rootCodeId resolution:", err);
        rootCodeId = parentCodeId;
      }
    }

    const id = generateUniqueId();
    const createdAt = new Date().toISOString();
    // Valid for 30 days
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const snippet: CodeSnippet = {
      id,
      code,
      language,
      title: title || "Code sans titre",
      createdAt,
      expiresAt,
      parentCodeId: parentCodeId || undefined,
      rootCodeId,
      tags: processedTags.length > 0 ? processedTags : undefined,
      ownerId: ownerId || undefined,
      ownerName: ownerName || undefined,
    };

    // Attempt Firebase
    const hasFirebase = await initFirebase();
    if (hasFirebase && firebaseDb) {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(firebaseDb, "snippets", id), snippet);
        console.log(`Saved snippet ${id} in Firestore successfully.`);
        return res.json({ id, firebase: true });
      } catch (e: any) {
        console.error("Firebase save failed, falling back to local file system.", e);
      }
    }

    // Fallback to local
    snippet.isLocalFallback = true;
    saveLocalSnippet(snippet);
    return res.json({ id, firebase: false });
  });

  // API SEARCH: Search code snippets by tags, language, or content keywords querying Firebase with local fallback
  app.get("/api/snippets/search", async (req, res) => {
    const { q, language, tags } = req.query;

    let snippetsList: CodeSnippet[] = [];

    // Attempt Firebase
    const hasFirebase = await initFirebase();
    if (hasFirebase && firebaseDb) {
      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const snippetsRef = collection(firebaseDb, "snippets");
        const querySnapshot = await getDocs(snippetsRef);
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          snippetsList.push({
            id: docSnap.id,
            ...data
          } as CodeSnippet);
        });
      } catch (e) {
        console.error("Firebase read for search failed, fetching from local DB.", e);
      }
    }

    if (snippetsList.length === 0) {
      snippetsList = Object.values(getLocalSnippets());
    }

    const now = new Date();
    // Filter out expired snippets
    let filtered = snippetsList.filter(s => {
      const expires = new Date(s.expiresAt);
      return now <= expires;
    });

    // 1. Filter by language (if specified and not 'all')
    if (language && typeof language === "string" && language !== "all") {
      filtered = filtered.filter(s => s.language && s.language.toLowerCase() === language.toLowerCase());
    }

    // 2. Filter by tags (if specified)
    if (tags && typeof tags === "string") {
      const queryTags = tags.split(",")
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);
      
      if (queryTags.length > 0) {
        filtered = filtered.filter(s => {
          if (!s.tags || !Array.isArray(s.tags)) return false;
          return s.tags.some(t => queryTags.includes(t.toLowerCase()));
        });
      }
    }

    // 3. Filter by keywords/content (if specified)
    if (q && typeof q === "string") {
      const keyword = q.trim().toLowerCase();
      if (keyword) {
        filtered = filtered.filter(s => {
          const titleMatch = s.title && s.title.toLowerCase().includes(keyword);
          const codeMatch = s.code && s.code.toLowerCase().includes(keyword);
          const tagsMatch = s.tags && Array.isArray(s.tags) && s.tags.some(t => t.toLowerCase().includes(keyword));
          return !!(titleMatch || codeMatch || tagsMatch);
        });
      }
    }

    // Sort by createdAt desc
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Limit to top 50 matches
    filtered = filtered.slice(0, 50);

    return res.json(filtered);
  });

  // API 3: Get shared Snippet
  app.get("/api/snippets/:id", async (req, res) => {
    const { id } = req.params;

    // Check Firebase first
    const hasFirebase = await initFirebase();
    if (hasFirebase && firebaseDb) {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const docRef = doc(firebaseDb, "snippets", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as CodeSnippet;
          // Verify expiration
          const now = new Date();
          const expires = new Date(data.expiresAt);
          if (now > expires) {
            return res.status(410).json({ error: "Ce code a expiré après la limite légale d'un mois." });
          }

          return res.json(data);
        }
      } catch (e) {
        console.error("Firebase read failed, matching in local database fallback.", e);
      }
    }

    // Fallback to local read
    const snippets = getLocalSnippets();
    const localSnippet = snippets[id];

    if (localSnippet) {
      const now = new Date();
      const expires = new Date(localSnippet.expiresAt);
      if (now > expires) {
        return res.status(410).json({ error: "Ce code a expiré après la limite légale d'un mois." });
      }
      return res.json(localSnippet);
    }

    return res.status(404).json({ error: "Snippet introuvable ou expiré." });
  });

  // API 4: Get version history family of a snippet
  app.get("/api/snippets/:id/versions", async (req, res) => {
    const { id } = req.params;

    try {
      const currentSnippet = await findSnippetById(id);
      if (!currentSnippet) {
        return res.status(404).json({ error: "Snippet introuvable pour récupérer l'historique des versions." });
      }

      const familyRootId = currentSnippet.rootCodeId || currentSnippet.id;

      let snippetsList: CodeSnippet[] = [];

      // Query database
      const hasFirebase = await initFirebase();
      if (hasFirebase && firebaseDb) {
        try {
          const { collection, getDocs } = await import("firebase/firestore");
          const querySnapshot = await getDocs(collection(firebaseDb, "snippets"));
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            snippetsList.push({
              id: docSnap.id,
              ...data
            } as CodeSnippet);
          });
        } catch (e) {
          console.error("Firebase read for versions failed, falling back to local database.", e);
        }
      }

      if (snippetsList.length === 0) {
        snippetsList = Object.values(getLocalSnippets());
      }

      // Filter family line
      const family = snippetsList.filter(s => {
        return s.id === familyRootId || s.rootCodeId === familyRootId || s.parentCodeId === familyRootId;
      });

      // Sort ascending by creation date
      family.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return res.json(family);
    } catch (error: any) {
      console.error("Error fetching version lineage family:", error);
      return res.status(500).json({ error: "Erreur serveur lors de la récupération des versions." });
    }
  });

  // Serve static files in production / Vite middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SeeMyCode Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
