import React, { useState, useEffect, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { QRCodeSVG } from "qrcode.react";
import {
  Terminal,
  Check,
  Copy,
  Sparkles,
  Share2,
  Clock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  GitFork,
  CornerDownRight,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Code2,
  Lock,
  ChevronRight,
  Search,
  Tag,
  SlidersHorizontal,
  Twitter,
  Linkedin,
  Mail,
  Filter,
  Eye
} from "lucide-react";

// List of supported languages for the selector
const SUPPORTED_LANGUMENTS = [
  { value: "html", label: "HTML", placeholder: "<!-- Saisissez votre code HTML ici -->\n<div class='card'>\n  <h1>Bonjour !</h1>\n</div>" },
  { value: "css", label: "CSS", placeholder: "/* Styles CSS */\n.card {\n  background: #3b82f6;\n  padding: 1rem;\n  border-radius: 8px;\n}" },
  { value: "javascript", label: "JavaScript", placeholder: "// Code JS\nfunction calculateSum(a, b) {\n  return a + b;\n}\nconsole.log(calculateSum(5, 10));" },
  { value: "typescript", label: "TypeScript", placeholder: "// Code TS\ninterface User {\n  id: number;\n  name: string;\n}\nconst greet = (u: User): string => `Hello ${u.name}`;" },
  { value: "typescript", label: "React (TSX)", placeholder: "import React, { useState } from 'react';\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <div className=\"p-4 flex flex-col items-center justify-center bg-slate-900 text-white rounded-xl min-h-[150px]\">\n      <p className=\"text-sm font-mono text-slate-400 mb-2\">Composant React en action</p>\n      <button \n        onClick={() => setCount(count + 1)}\n        className=\"px-4 py-2 bg-indigo-600 hover:bg-indigo-505 rounded-lg font-bold text-xs shadow transition-all\"\n      >\n        Incrémenter : {count}\n      </button>\n    </div>\n  );\n}" },
  { value: "python", label: "Python", placeholder: "# Script Python - Détermination des nombres premiers\ndef find_primes(limit):\n    primes = []\n    for num in range(2, limit + 1):\n        is_prime = True\n        for i in range(2, int(num ** 0.5) + 1):\n            if num % i == 0:\n                is_prime = False\n                break\n        if is_prime:\n            primes.append(num)\n    return primes\n\n# Affichage du résultat\nprint(\"Nombres premiers jusqu'à 20 :\", find_primes(20))" },
  { value: "php", label: "PHP", placeholder: "<?php\n// Script PHP\n$items = ['HTML', 'CSS', 'JS'];\nforeach ($items as $item) {\n    echo \"Skill: $item\\n\";\n}" },
  { value: "csharp", label: "ASP.NET (C#)", placeholder: "using System;\n// ASP.NET C# class\npublic class Program {\n    public static void Main() {\n        Console.WriteLine(\"Hello World from ASP.NET C#\");\n    }\n}" },
  { value: "html", label: "Twig", placeholder: "{# Modèle Twig #}\n{% for article in articles %}\n  <article class=\"post\">\n    <h2>{{ article.title }}</h2>\n    <p>{{ article.summary }}</p>\n  </article>\n{% endfor %}" },
  { value: "markdown", label: "Markdown", placeholder: "# Mon Snippet\n\n- Liste point 1\n- Liste point 2\n\n```js\nconsole.log('Hello');\n```" }
];

interface CorrectionResult {
  success: boolean;
  originalExplanation: string;
  correctedCode: string;
  correctionsList: string[];
}

interface DocSnippet {
  id: string;
  code: string;
  language: string;
  title?: string;
  createdAt: string;
  expiresAt: string;
  parentCodeId?: string;
  isLocalFallback?: boolean;
  tags?: string[];
}

function getPreviewDoc(code: string, language: string) {
  if (language === "html" || language === "twig") {
    // Direct HTML render
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 16px;
              background-color: #ffffff;
              color: #0f172a;
            }
          </style>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
  }

  if (language === "css") {
    // CSS wrapped preview
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 24px;
              background-color: #f8fafc;
              color: #0f172a;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
            }
            .preview-container {
              width: 100%;
              max-width: 500px;
              background: white;
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
              border: 1px solid #e2e8f0;
            }
            .demo-header {
              font-size: 18px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 8px;
            }
            .demo-desc {
              font-size: 13px;
              color: #64748b;
              line-height: 1.5;
              margin-bottom: 20px;
            }
            .test-elements {
              display: flex;
              flex-direction: column;
              gap: 16px;
              border-top: 1px solid #f1f5f9;
              padding-top: 20px;
            }
            ${code}
          </style>
        </head>
        <body>
          <div class="preview-container">
            <div class="demo-header">Aperçu de vos règles CSS</div>
            <p class="demo-desc">
              Vos styles CSS ont été injectés dans cette page. Vous pouvez styliser des balises HTML standards ou des classes comme <code>.card</code>, <code>.btn</code> ou <code>.title</code>.
            </p>
            
            <div class="test-elements">
              <div>
                <h1 class="title">Titre H1 (.title)</h1>
                <p class="text">Ceci est un paragraphe avec la classe <code>.text</code>.</p>
              </div>
              <div>
                <button class="btn font-medium">Bouton de Test (.btn)</button>
              </div>
              <div class="card p-4">
                <div class="font-bold">Composant Carte (.card)</div>
                <p class="text-[12px] opacity-75 mt-1">Élément de conteneur d'exemple.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  if (language === "javascript" || language === "typescript") {
    // Escape single/double quotes and backticks in the injected code
    const escapedCode = code
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\${/g, '\\${');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              margin: 0;
              padding: 16px;
              background-color: #0f172a;
              color: #e2e8f0;
              font-size: 13px;
              line-height: 1.5;
            }
            h3 {
              margin-top: 0;
              color: #38bdf8;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 1px solid #1e293b;
              padding-bottom: 8px;
              font-family: system-ui, sans-serif;
            }
            .console-item {
              display: flex;
              margin-bottom: 4px;
              padding: 4px 8px;
              border-radius: 4px;
            }
            .log { color: #f8fafc; }
            .error { color: #f87171; background-color: rgba(248, 113, 113, 0.1); border-left: 3px solid #f87171; }
            .warn { color: #fbbf24; background-color: rgba(251, 191, 36, 0.1); border-left: 3px solid #fbbf24; }
            .info { color: #38bdf8; background-color: rgba(56, 189, 248, 0.1); border-left: 3px solid #38bdf8; }
            .empty { color: #64748b; font-style: italic; }
          </style>
        </head>
        <body>
          <h3>Console JavaScript d'Exécution en direct</h3>
          <div id="output"></div>

          <script>
            const outputDiv = document.getElementById('output');

            function appendLog(type, args) {
              const item = document.createElement('div');
              item.className = 'console-item ' + type;
              
              const text = args.map(arg => {
                if (typeof arg === 'object') {
                  try {
                    return JSON.stringify(arg);
                  } catch(e) {
                    return String(arg);
                  }
                }
                return String(arg);
              }).join(' ');

              item.textContent = \`[\${new Date().toLocaleTimeString()}] \${text}\`;
              outputDiv.appendChild(item);
              window.scrollTo(0, document.body.scrollHeight);
            }

            // Override basic console
            const originalLog = console.log;
            console.log = function(...args) {
              appendLog('log', args);
              originalLog.apply(console, args);
            };

            const originalError = console.error;
            console.error = function(...args) {
              appendLog('error', args);
              originalError.apply(console, args);
            };

            const originalWarn = console.warn;
            console.warn = function(...args) {
              appendLog('warn', args);
              originalWarn.apply(console, args);
            };

            const originalInfo = console.info;
            console.info = function(...args) {
              appendLog('info', args);
              originalInfo.apply(console, args);
            };

            window.addEventListener('error', function(e) {
              appendLog('error', [e.message, 'à la ligne', e.lineno]);
            });

            try {
              // Create dynamic script element to avoid render breaking
              const scriptEl = document.createElement('script');
              scriptEl.textContent = \`${escapedCode}\`;
              document.body.appendChild(scriptEl);

              if (outputDiv.children.length === 0) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'console-item empty';
                emptyDiv.textContent = "Le script s'est exécuté sans produire de sortie console.";
                outputDiv.appendChild(emptyDiv);
              }
            } catch (err) {
              appendLog('error', [err.message]);
            }
          </script>
        </body>
      </html>
    `;
  }

  if (language === "markdown") {
    // Escape string values securely for marked
    const escapedCode = code
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\${/g, '\\${');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 24px;
              background-color: #ffffff;
              color: #0f172a;
              line-height: 1.6;
            }
            .markdown-body {
              max-width: 800px;
              margin: 0 auto;
            }
            h1, h2, h3 {
              color: #1e293b;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 8px;
              margin-top: 24px;
            }
            code {
              background-color: #f1f5f9;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: ui-monospace, SFMono-Regular, monospace;
              font-size: 13px;
            }
            pre {
              background-color: #0f172a;
              color: #e2e8f0;
              padding: 16px;
              border-radius: 8px;
              overflow-x: auto;
            }
            pre code {
              background-color: transparent;
              padding: 0;
              color: inherit;
            }
            blockquote {
              border-left: 4px solid #3b82f6;
              padding-left: 16px;
              color: #64748b;
              margin-left: 0;
              font-style: italic;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #f8fafc;
            }
          </style>
        </head>
        <body>
          <div id="content" class="markdown-body"></div>
          <script>
            try {
              document.getElementById('content').innerHTML = marked.parse(\`${escapedCode}\`);
            } catch(e) {
              document.getElementById('content').textContent = e.message;
            }
          </script>
        </body>
      </html>
    `;
  }

  // Default fallback for other languages (PHP, C#, etc. which can't execute natively in browser)
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 24px;
            background-color: #f1f5f9;
            color: #334155;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
            text-align: center;
          }
          .card {
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            max-width: 450px;
            border: 1px solid #e2e8f0;
          }
          h1 {
            font-size: 18px;
            color: #0f172a;
            margin-bottom: 12px;
          }
          p {
            font-size: 13px;
            line-height: 1.6;
            color: #64748b;
          }
          .badge {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            font-weight: bold;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 6px;
            text-transform: uppercase;
            margin-bottom: 14px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">${language}</span>
          <h1>Remplaçant Console dynamique</h1>
          <p>
            Le langage <strong>${language}</strong> s'exécute côté serveur ou nécessite une machine virtuelle dédiée. L'exécution dynamique en direct (Live Sandbox) n'est pas supportée nativement dans une iframe client standard.
          </p>
          <p style="margin-top: 12px; opacity: 0.8; font-size: 12px;">
            Utilisez <strong>HTML</strong>, <strong>CSS</strong>, <strong>JavaScript</strong> ou <strong>Markdown</strong> pour obtenir un rendu visuel en temps réel et interactif !
          </p>
        </div>
      </body>
    </html>
  `;
}

export default function App() {
  // Navigation / Loading States
  const [snippetId, setSnippetId] = useState<string | null>(null);
  const [isLoadingSnippet, setIsLoadingSnippet] = useState(false);
  const [snippetError, setSnippetError] = useState<string | null>(null);

  // Editor State
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [title, setTitle] = useState("");
  const [parentCodeId, setParentCodeId] = useState<string | null>(null);

  // Correction AI States
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correctionResult, setCorrectionResult] = useState<CorrectionResult | null>(null);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // Share States
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareDateExpires, setShareDateExpires] = useState<string | null>(null);
  const [isFallbackDb, setIsFallbackDb] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Custom Tagging and Cloud Search States
  const [tagInput, setTagInput] = useState("");
  const [loadedTags, setLoadedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLanguage, setSearchLanguage] = useState("all");
  const [searchTags, setSearchTags] = useState("");
  const [searchResults, setSearchResults] = useState<DocSnippet[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHasExecuted, setSearchHasExecuted] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);

  // Copy Feedback state
  const [copiedCodeActive, setCopiedCodeActive] = useState(false);
  const [copiedUrlActive, setCopiedUrlActive] = useState(false);

  // Show Tutorial / Firebase Explain section
  const [showTtlExplain, setShowTtlExplain] = useState(false);

  // Mode Lecture Seule (Community View)
  const isReadOnlyMode = !!snippetId;

  // Real-time Linting / Diagnostics States
  const [showLinting, setShowLinting] = useState(true);
  const [markers, setMarkers] = useState<any[]>([]);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState(false);

  // Active View Tab: Code Editor vs Real-time HTML Preview
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");

  // Refs to reference the editor instance locally
  const editorRef = useRef<any>(null);

  const monaco = useMonaco();

  // Dynamic Toggle for Monaco Diagnostics Config
  useEffect(() => {
    if (!monaco) return;

    const langs = monaco.languages as any;

    // Toggle typescript and javascript diagnostics
    if (typeof langs.typescript?.javascriptDefaults?.setDiagnosticsOptions === "function") {
      try {
        langs.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: !showLinting,
          noSyntaxValidation: !showLinting,
        });
      } catch (e) {
        console.warn("Unable to configure javascript diagnostics", e);
      }
    }
    if (typeof langs.typescript?.typescriptDefaults?.setDiagnosticsOptions === "function") {
      try {
        langs.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: !showLinting,
          noSyntaxValidation: !showLinting,
        });
      } catch (e) {
        console.warn("Unable to configure typescript diagnostics", e);
      }
    }

    // Toggle css diagnostics
    if (typeof langs.css?.cssDefaults?.setDiagnosticsOptions === "function") {
      try {
        langs.css.cssDefaults.setDiagnosticsOptions({
          validate: showLinting,
        });
      } catch (e) {
        console.warn("Unable to configure css diagnostics", e);
      }
    }

    // Toggle html diagnostics
    if (typeof langs.html?.htmlDefaults?.setDiagnosticsOptions === "function") {
      try {
        langs.html.htmlDefaults.setDiagnosticsOptions({
          validate: showLinting,
        });
      } catch (e) {
        console.warn("Unable to configure html diagnostics", e);
      }
    }
  }, [monaco, showLinting]);

  // Handle markers diagnostic changes and lists in state
  useEffect(() => {
    if (!monaco) return;

    const updateMarkers = () => {
      if (!showLinting) {
        setMarkers([]);
        const models = monaco.editor.getModels();
        models.forEach(model => {
          monaco.editor.setModelMarkers(model, "typescript", []);
          monaco.editor.setModelMarkers(model, "css", []);
          monaco.editor.setModelMarkers(model, "html", []);
        });
        return;
      }
      const allMarkers = monaco.editor.getModelMarkers({});
      setMarkers(allMarkers);
    };

    updateMarkers();

    const disposable = monaco.editor.onDidChangeMarkers(() => {
      updateMarkers();
    });

    return () => {
      disposable.dispose();
    };
  }, [monaco, showLinting, code, language]);

  // React on address path change for modern community load
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/code\/([a-zA-Z0-9]+)$/);
      if (match) {
        const id = match[1];
        setSnippetId(id);
        fetchSharedSnippet(id);
      } else {
        setSnippetId(null);
        // Default placeholders if starting fresh and empty
        if (code === "") {
          const selectedLang = SUPPORTED_LANGUMENTS.find(l => l.value === language);
          setCode(selectedLang?.placeholder || "");
        }
      }
    };

    handleLocationChange();
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, [snippetId]);

  // Adjust placeholder when language changes
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    // Only replace if current code is standard placeholder of another language or empty
    const isPlaceholder = SUPPORTED_LANGUMENTS.some(l => l.placeholder.trim() === code.trim() || code.trim() === "");
    if (isPlaceholder || code === "") {
      const targetLang = SUPPORTED_LANGUMENTS.find(l => l.value === newLang);
      setCode(targetLang?.placeholder || "");
    }
  };

  // Fetch from DB
  const fetchSharedSnippet = async (id: string) => {
    setIsLoadingSnippet(true);
    setSnippetError(null);
    setCorrectionResult(null); // Clear previous corrections
    try {
      const response = await fetch(`/api/snippets/${id}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Impossible de charger ce code snippet.");
      }
      const data: DocSnippet = await response.json();
      setCode(data.code);
      setLanguage(data.language);
      setTitle(data.title || "");
      setParentCodeId(data.parentCodeId || null);
      setLoadedTags(data.tags || []);
      setTagInput(data.tags ? data.tags.join(", ") : "");
    } catch (err: any) {
      console.error(err);
      setSnippetError(err.message || "Erreur de chargement.");
    } finally {
      setIsLoadingSnippet(false);
    }
  };

  // call Gemini correction api
  const handleCorrectCode = async () => {
    if (!code.trim()) return;
    setIsCorrecting(true);
    setCorrectionResult(null);
    setCorrectionError(null);

    try {
      const response = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Une erreur est survenue lors de l'appel Gemini.");
      }

      const data: CorrectionResult = await response.json();
      setCorrectionResult(data);
    } catch (err: any) {
      console.error(err);
      setCorrectionError(err.message || "Impossible d'analyser le code.");
    } finally {
      setIsCorrecting(false);
    }
  };

  // save to Firestore
  const handleShareSnippet = async () => {
    if (!code.trim()) return;
    setIsSharing(true);
    try {
      const tagsArray = tagInput
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          title: title.trim() || "Snippet d'entraide",
          parentCodeId: parentCodeId || undefined,
          tags: tagsArray
        })
      });

      if (!response.ok) {
        throw new Error("Erreur de sauvegarde.");
      }

      const data = await response.json();
      const generatedUrl = `${window.location.protocol}//${window.location.host}/code/${data.id}`;
      setShareUrl(generatedUrl);
      setIsFallbackDb(!data.firebase);

      // Expiration is in 30 days
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      setShareDateExpires(expirationDate.toLocaleDateString("fr-FR"));

      setShowShareModal(true);

      // Change path smoothly in browser
      window.history.pushState(null, "", `/code/${data.id}`);
      setSnippetId(data.id);
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la génération du lien d'entraide : " + err.message);
    } finally {
      setIsSharing(false);
    }
  };

  // Handle Fork and Edit (modifer le code de quelqu'un d'autre)
  const handleFork = () => {
    if (!snippetId) return;
    // Set current active code as parent id
    setParentCodeId(snippetId);
    setSnippetId(null);
    // clear the address to /
    window.history.pushState(null, "", "/");
  };

  // Apply Correction suggested by Gemini
  const handleApplyCorrection = () => {
    if (correctionResult?.correctedCode) {
      setCode(correctionResult.correctedCode);
      setCorrectionResult(null); // Close correction panel/state
    }
  };

  // Search Cloud Snippets from Firebase or Local Fallback
  const handleSearchSnippets = async () => {
    setIsSearching(true);
    setSearchHasExecuted(true);
    try {
      const qParams = new URLSearchParams();
      if (searchQuery.trim()) qParams.append("q", searchQuery.trim());
      if (searchLanguage !== "all") qParams.append("language", searchLanguage);
      if (searchTags.trim()) {
        const cleanedTags = searchTags
          .split(",")
          .map(t => t.trim())
          .filter(Boolean)
          .join(",");
        qParams.append("tags", cleanedTags);
      }

      const response = await fetch(`/api/snippets/search?${qParams.toString()}`);
      if (!response.ok) {
        throw new Error("Impossible d'effectuer la recherche.");
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string, type: "code" | "url") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCodeActive(true);
      setTimeout(() => setCopiedCodeActive(false), 2000);
    } else {
      setCopiedUrlActive(true);
      setTimeout(() => setCopiedUrlActive(false), 2000);
    }
  };

  // Formatted date string utility
  const getExpiresLabel = () => {
    if (shareDateExpires) return shareDateExpires;
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#0f172a] text-slate-300 font-sans flex flex-col transition-all selection:bg-indigo-500/30">
      
      {/* HEADER BAR */}
      <nav className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#1e293b]/50 backdrop-blur-sm sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
            window.history.pushState(null, "", "/");
            setSnippetId(null);
            setTitle("");
            setParentCodeId(null);
            setCorrectionResult(null);
          }}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">S</div>
            <span className="text-xl font-bold text-white tracking-tight">SeeMy<span className="text-indigo-400">Code</span></span>
          </div>
          
          <div className="h-6 w-px bg-slate-700 mx-2 hidden md:block"></div>
          
          <div className="hidden md:flex items-center gap-1 bg-slate-800 rounded-md px-3 py-1.5 border border-slate-700">
            <span className="text-[11px] font-medium text-slate-400">Language:</span>
            <select
              value={language}
              onChange={handleLanguageChange}
              disabled={isReadOnlyMode}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer focus:ring-0"
            >
              {SUPPORTED_LANGUMENTS.map((lang, idx) => (
                <option key={lang.label + idx} value={lang.value} className="bg-[#1e293b]">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isReadOnlyMode ? (
            <button
              onClick={handleFork}
              className="flex items-center gap-2 px-3 py-2 bg-slate-850 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
              id="fork-edit-btn"
            >
              <GitFork className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fork & Edit</span>
            </button>
          ) : (
            <button
              onClick={handleShareSnippet}
              disabled={isSharing || !code.trim()}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-900 transition-all disabled:opacity-40"
              id="share-btn"
            >
              {isSharing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-900" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-slate-900" />
              )}
              <span>Share</span>
            </button>
          )}

          <button
            onClick={handleCorrectCode}
            disabled={isCorrecting || !code.trim()}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-40"
            id="correct-code-btn-header"
          >
            {isCorrecting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>Correct code</span>
          </button>

          <button
            onClick={() => setShowTtlExplain(!showTtlExplain)}
            className="p-2 bg-slate-800 hover:bg-slate-755 border border-slate-720 rounded-lg text-slate-400 hover:text-white"
            title="Purge TTL Informations"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* RETAIN BANNER IF COMM COMMUNITY MODE */}
      {isReadOnlyMode && !isLoadingSnippet && !snippetError && (
        <div className="bg-[#1e293b]/30 border-b border-slate-800 px-6 py-2.5 text-xs text-slate-400 shrink-0">
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>
                Vous examinez un code partagé : {title ? <strong className="text-white">« {title} »</strong> : "Code communautaire"}. Vous ne pouvez pas le modifier sur cette URL.
              </span>
            </div>
            <button
              onClick={handleFork}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium px-3 py-1 rounded border border-slate-700 text-[11px] transition-all"
            >
              <GitFork className="w-3 h-3 text-indigo-400" />
              <span>Forker ce code</span>
            </button>
          </div>
        </div>
      )}

      {/* CORE FRAMEWORK CONTAINER */}
      <main className="flex-1 w-full px-4 lg:px-6 py-4 flex flex-col gap-4 overflow-y-auto lg:overflow-hidden min-h-0">
        
        {/* TTL / FAQ COMPONENT (collapsible explanation panel) */}
        {showTtlExplain && (
          <div className="bg-[#1e293b]/40 border border-[#334155]/60 rounded-xl p-5 shadow-xl relative overflow-hidden animate-fadeIn">
            <div className="absolute right-4 top-4">
              <button
                onClick={() => setShowTtlExplain(false)}
                className="text-slate-500 hover:text-white transition-colors text-xs font-mono p-1 select-none"
              >
                [Fermer]
              </button>
            </div>
            <h3 className="text-sm font-bold text-indigo-300 mb-2.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Politique TTL (Time To Live) Firestore - Purge sous 30 Jours
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed max-w-4xl">
              Pour des raisons de performance et de protection de la vie privée, tous vos codes sont stockés de manière temporaire. Un index TTL (Time-To-Live) Firestore nettoye automatiquement les documents expirés.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 text-xs font-mono text-slate-400">
              <div className="bg-slate-950/50 p-3.5 rounded-lg border border-slate-800">
                <span className="text-indigo-400 font-bold block mb-1.5">// Structure d'un snippet éphémère</span>
                <span className="text-slate-500">{"{"}</span><br />
                &nbsp;&nbsp;code: <span className="text-amber-200">"..."</span>,<br />
                &nbsp;&nbsp;expiresAt: <span className="text-cyan-400">"2026-07-01T15:59:00Z"</span> <span className="text-slate-600">// +30 jours</span><br />
                <span className="text-slate-500">{"}"}</span>
              </div>

              <div className="bg-slate-950/50 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-indigo-400 font-bold block mb-1.5">// Configuration Console Firebase</span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                    <li>Firestore Database &gt; Onglet <strong className="text-amber-400 font-medium">TTL</strong></li>
                    <li>Activer la politique TTL sur la collection <strong className="text-indigo-300 font-medium">snippets</strong></li>
                    <li>Indiquer le champ d'horodatage : <strong className="text-emerald-400 font-medium">expiresAt</strong></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {isLoadingSnippet ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 bg-[#1e293b]/10 border border-slate-800 rounded-xl">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400 font-mono text-xs">Extraction sécurisée du snippet communautaire...</p>
          </div>
        ) : snippetError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-slate-950/30 border border-red-500/10 rounded-xl text-center px-4">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <h3 className="text-md font-bold text-slate-200 mb-1.5">Code Expiré ou Inexistant</h3>
            <p className="text-slate-500 text-xs max-w-md leading-relaxed mb-6">
              {snippetError} Bien que nous visions une persistance de 30 jours, il est possible que la politique TTL de notre Firestore ait déjà supprimé ou épuré cette référence devenue obsolète.
            </p>
            <button
              onClick={() => {
                window.history.pushState(null, "", "/");
                setSnippetId(null);
                setSnippetError(null);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors"
            >
              Créer un nouveau snippet d'entraide
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0 lg:overflow-hidden">
            
            {/* LEFT / CENTER PANEL: THE EDITOR */}
            <div className={`flex flex-col gap-4 ${correctionResult ? 'lg:col-span-7' : 'lg:col-span-8'} transition-all duration-300 lg:h-full lg:overflow-y-auto pr-0.5 min-h-0 scrollbar-thin`}>
              
              {/* Editor controls banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#1e293b]/30 border border-slate-800 rounded-xl">
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 rounded-lg text-indigo-500">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest block font-bold">
                      {isReadOnlyMode ? "Read-Only Mode" : "Modèle de conception"}
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-800 rounded px-2 py-0.5 border border-slate-700 mt-1">
                      <span className="text-[10px] font-medium text-slate-400 font-mono">LANG:</span>
                      <select
                        value={language}
                        onChange={handleLanguageChange}
                        disabled={isReadOnlyMode}
                        className="bg-transparent text-[11px] font-bold text-slate-200 outline-none cursor-pointer"
                      >
                        {SUPPORTED_LANGUMENTS.map((lang, idx) => (
                          <option key={lang.label + idx} value={lang.value} className="bg-slate-900">
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Titre</span>
                    <input
                      type="text"
                      placeholder="Titre du snippet d'entraide..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isReadOnlyMode}
                      className="bg-[#0f172a] text-xs border border-slate-700/80 font-medium rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 w-44 sm:w-48 focus:outline-none focus:border-indigo-500 disabled:opacity-75"
                    />
                  </div>

                  {!isReadOnlyMode ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Tags (séparés par virgule)</span>
                      <input
                        type="text"
                        placeholder="ex: web, react, bug"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        className="bg-[#0f172a] text-xs border border-slate-700/80 font-medium rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-505 w-44 sm:w-56 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    loadedTags.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Tags associés</span>
                        <div className="flex flex-wrap gap-1">
                          {loadedTags.map((t, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-305 border border-indigo-500/20 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide font-mono"
                            >
                              <Tag className="w-2.5 h-2.5 text-indigo-400" />
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>

              </div>

              {/* Monaco IDE Element */}
              <div className="flex-1 bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden p-0 shadow-lg min-h-[400px] lg:min-h-[480px] xl:min-h-[520px] flex flex-col relative group">
                
                {/* Visual badge top of editor */}
                <div className="h-10 bg-[#0f172a]/40 flex items-center justify-between px-4 border-b border-slate-800 gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 mr-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/85"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/85"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/85"></div>
                    </div>

                    {/* Editor / Preview Tabs */}
                    <div className="flex items-center bg-slate-900 border border-slate-800/80 rounded-lg p-0.5">
                      <button
                        onClick={() => setActiveTab("code")}
                        className={`flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          activeTab === "code"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Éditeur de Code"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>Éditeur</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("preview")}
                        className={`flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          activeTab === "preview"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Rendu visuel dynamique"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Aperçu</span>
                      </button>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-bold">
                    {activeTab === "code" ? `editor.${language}` : "preview.html"} {isReadOnlyMode ? '— readonly' : ''}
                  </span>
                  
                  {/* Real-time Syntax Check Gutter Switch Toggle */}
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-[10px] font-mono font-bold text-slate-400 select-none">
                      <input
                        type="checkbox"
                        checked={showLinting}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setShowLinting(val);
                          // Force update panel visibility if turning off
                          if (!val) setShowDiagnosticsPanel(false);
                        }}
                        className="sr-only peer"
                      />
                      <div className="relative w-6 h-3.5 bg-[#0f172a] rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
                      <span className="hidden sm:inline">Gutter syntax errors : {showLinting ? "Actif" : "Masqué"}</span>
                      <span className="inline sm:hidden">Linter {showLinting ? "ON" : "OFF"}</span>
                    </label>
                  </div>
                </div>

                {activeTab === "code" ? (
                  <div className="flex-1 min-h-[380px] lg:min-h-0 lg:h-full p-2 bg-[#1e293b]">
                    <Editor
                      height="100%"
                      language={language}
                      theme="vs-dark"
                      value={code}
                      onChange={(val) => setCode(val || "")}
                      onMount={(editor) => {
                        editorRef.current = editor;
                      }}
                      options={{
                        readOnly: isReadOnlyMode,
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: "JetBrains Mono, Menlo, Monaco, Courier New, monospace",
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        roundedSelection: true,
                        automaticLayout: true,
                        renderValidationDecorations: showLinting ? "on" : "off",
                        glyphMargin: showLinting,
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-h-[380px] lg:min-h-0 lg:h-full p-0 bg-white relative">
                    <iframe
                      title="SeeMyCode Live Preview"
                      srcDoc={getPreviewDoc(code, language)}
                      sandbox="allow-scripts"
                      className="w-full h-full lg:absolute lg:inset-0 border-none bg-white rounded-b-xl"
                    />
                  </div>
                )}

                {/* Floating quick utility button */}
                {activeTab === "code" && (
                  <button
                    onClick={() => copyToClipboard(code, "code")}
                    className="absolute right-4 bottom-4 z-10 p-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all shadow-md active:scale-95 group-hover:opacity-100 opacity-60 flex items-center gap-1.5"
                    title="Copier le code complet"
                  >
                    {copiedCodeActive ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-mono text-emerald-400">Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono">Copier</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Real-time Syntax Watchdog Diagnostic Details */}
              <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-xl overflow-hidden shadow-md flex flex-col">
                <button
                  onClick={() => setShowDiagnosticsPanel(!showDiagnosticsPanel)}
                  className="flex items-center justify-between px-4 py-3 bg-slate-900/50 text-xs font-mono select-none hover:bg-slate-900/80 transition-colors w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    {!showLinting ? (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
                        <span>Inspecteur désactivé (Activez les erreurs d'éditeur)</span>
                      </div>
                    ) : markers.length === 0 ? (
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>✓ Aucun problème de syntaxe détecté (Temps réel)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>⚠ {markers.length} anomalie{markers.length > 1 ? "s" : ""} de structure détectée{markers.length > 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] text-slate-500">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[9px] text-slate-400 inline-block font-bold">
                      {showDiagnosticsPanel ? "MASQUER L'INSPECTEUR" : "AFFICHER L'INSPECTEUR"}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showDiagnosticsPanel ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {showDiagnosticsPanel && (
                  <div className="p-4 border-t border-slate-800/60 bg-[#0f172a]/40 max-h-52 overflow-y-auto space-y-2">
                    {!showLinting ? (
                      <p className="text-slate-500 text-xs text-center py-3 font-mono">
                        Activez "Gutter syntax errors" en haut à droite de l'éditeur pour inspecter votre code en temps réel.
                      </p>
                    ) : markers.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-3 font-mono leading-relaxed">
                        Chaque modification est analysée en temps réel. Aucun avertissement ou erreur détectée actuellement !
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {markers.map((marker, index) => {
                          const isError = marker.severity === 8;
                          const isWarning = marker.severity === 4;
                          return (
                            <div
                              key={index}
                              onClick={() => {
                                if (editorRef.current) {
                                  editorRef.current.revealLineInCenter(marker.startLineNumber);
                                  editorRef.current.setPosition({
                                    lineNumber: marker.startLineNumber,
                                    column: marker.startColumn
                                  });
                                  editorRef.current.focus();
                                }
                              }}
                              className="group flex items-start gap-2.5 p-2 bg-[#0f172a]/60 hover:bg-slate-800/60 border border-slate-800/30 rounded-lg cursor-pointer transition-all"
                              title="Naviguer vers cette ligne"
                            >
                              <div className="mt-0.5 shrink-0">
                                {isError ? (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                ) : isWarning ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                ) : (
                                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-805 px-1.5 py-0.2 rounded group-hover:text-white transition-colors">
                                    Ligne {marker.startLineNumber}:{marker.startColumn}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                                    {marker.source || "syntaxe"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 font-mono mt-0.5 break-words">
                                  {marker.message}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACTION TOGGLE FOOTER */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCorrectCode}
                  disabled={isCorrecting || !code.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase"
                  id="correct-code-btn"
                >
                  {isCorrecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Gemini analyse votre code...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Correct My Code (Analyse & Correction IA)</span>
                    </>
                  )}
                </button>

                {!isReadOnlyMode && (
                  <button
                    onClick={handleShareSnippet}
                    disabled={isSharing || !code.trim()}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-705 px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-40 text-xs uppercase"
                    id="share-community-btn"
                  >
                    {isSharing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-300" />
                        <span>Enreg...</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-slate-300" />
                        <span>Share on Cloud (1 mois)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* EXPLORATEUR DE CODES COMMUNAUTAIRES (FIRESTORE CLOUD SEARCH) */}
              <div className="bg-[#1e293b]/20 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-205 uppercase tracking-wider">Explorateur Cloud (Firestore)</h3>
                      <p className="text-[10px] text-slate-500 font-mono">Recherchez parmi les codes par tags, langages ou mots-clés</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowSearchPanel(!showSearchPanel);
                      if (!showSearchPanel && searchResults.length === 0) {
                        handleSearchSnippets();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/85 hover:bg-slate-700 text-[11px] font-bold text-slate-300 border border-slate-700 transition-all select-none"
                  >
                    <Filter className="w-3 h-3 text-indigo-400" />
                    <span>{showSearchPanel ? "Masquer la recherche" : "Ouvrir la recherche"}</span>
                  </button>
                </div>

                {showSearchPanel && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Search Field Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-5 flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Mots-clés / Titre / Code</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Rechercher par mot-clé (ex: function)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearchSnippets()}
                            className="w-full bg-[#0f172a] text-slate-200 text-xs pl-9 pr-3 py-2 border border-slate-800 rounded-lg placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-3 flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Langage</label>
                        <select
                          value={searchLanguage}
                          onChange={(e) => setSearchLanguage(e.target.value)}
                          className="w-full bg-[#0f172a] text-xs px-3 py-2 border border-slate-800 rounded-lg text-slate-200 outline-none cursor-pointer focus:border-indigo-500"
                        >
                          <option value="all">Tous les langages</option>
                          {SUPPORTED_LANGUMENTS.map((lang, idx) => (
                            <option key={lang.label + idx} value={lang.value}>
                              {lang.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-4 flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Filtre par Tags</label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="ex: web, react, bug"
                            value={searchTags}
                            onChange={(e) => setSearchTags(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearchSnippets()}
                            className="w-full bg-[#0f172a] text-xs pl-9 pr-3 py-2 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Search Run Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleSearchSnippets}
                        disabled={isSearching}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-lg text-xs transition-colors shadow-md cursor-pointer"
                      >
                        {isSearching ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                        <span>Lancer la recherche</span>
                      </button>
                    </div>

                    {/* Results Area */}
                    <div className="border-t border-slate-800/80 pt-4 mt-1">
                      {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
                          <p className="text-xs text-slate-500 font-mono">Interrogation des collections Firestore...</p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                          {searchResults.map((item) => (
                            <div
                              key={item.id}
                              className="bg-[#0f172a]/60 hover:bg-slate-800/40 border border-slate-800/80 rounded-xl p-3.5 transition-all flex flex-col justify-between gap-3 group relative hover:border-slate-700 shadow-sm"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="text-[10px] font-bold uppercase font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/10">
                                    {item.language}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                                  {item.title || "Snippet d'entraide"}
                                </h4>
                                
                                {item.tags && item.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.tags.map((tag, tIdx) => (
                                      <span
                                        key={tIdx}
                                        className="bg-slate-800 text-slate-400 text-[9px] font-mono font-medium px-1.5 py-0.2 rounded"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-800/40 pt-2.5 mt-1">
                                <span className="text-[9px] text-slate-500 font-mono">
                                  Validité : 30 jours
                                </span>
                                
                                <button
                                  onClick={() => {
                                    window.history.pushState(null, "", `/code/${item.id}`);
                                    setSnippetId(item.id);
                                    fetchSharedSnippet(item.id);
                                  }}
                                  className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 font-bold px-2.5 py-1 rounded transition-all cursor-pointer"
                                >
                                  <span>Charger</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : searchHasExecuted ? (
                        <div className="text-center py-6 text-slate-500 text-xs font-mono">
                          Aucun snippet trouvé correspondant à vos critères dans Firestore.
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-500 text-xs font-mono">
                          Recherchez pour afficher les codes récemment publiés.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
            <aside className={`w-full ${correctionResult ? 'lg:col-span-5' : 'lg:col-span-4'} bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-lg lg:h-full min-h-0`}>
              
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Suggestions de Correction</h3>
                </div>
                <p className="text-[10px] text-slate-500">Gemini 3.5-flash</p>
              </div>

              {isCorrecting && (
                <div className="flex-1 p-6 flex flex-col items-center justify-center py-20 text-center animate-pulse">
                  <div className="w-10 h-10 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mb-4" />
                  <h4 className="font-bold text-slate-200 text-xs mb-1">Génération de la correction IA</h4>
                  <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                    Gemini examine la syntaxe, résout les erreurs courantes et prépare un code stable...
                  </p>
                </div>
              )}

              {correctionError && (
                <div className="p-5 mt-4 mx-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs">
                  <div className="flex gap-3 text-red-500">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold font-sans">Analyse impossible</h4>
                      <p className="text-slate-305 mt-1 leading-relaxed">
                        {correctionError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual Guidance Placeholder, displays details before Gemini results loaded */}
              {!correctionResult && !isCorrecting && (
                <div className="flex-1 p-5 space-y-4 overflow-y-auto scrollbar-thin">
                  
                  <div className="p-4 rounded-xl bg-slate-805/20 border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">01</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Configurez & Jouez</h4>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Entrez ou modifiez votre code web au centre de l'interface SeeMyCode.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#1e293b]/50 border border-slate-800/80 hover:border-[#334155]/60 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-303 px-1.5 py-0.5 rounded font-mono font-bold">02</span>
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Correct My Code</h4>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                      L'intelligence artificielle résout instantanément les bugs, améliore la structure CSS ou JS.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">03</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Lien communautaire</h4>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Chaque code publié dispose d'une adresse unique de 30 jours grâce au TTL native Firestore.
                    </p>
                  </div>

                </div>
              )}

              {/* GEMINI AI ANALYZED CORRECTION RESULT */}
              {correctionResult && (
                <div className="flex-1 flex flex-col min-h-0 justify-between overflow-hidden">
                  
                  <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0 scrollbar-thin">
                    
                    {/* Summary Explanation */}
                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <span className="text-[9px] text-indigo-300 font-mono uppercase tracking-wider block font-bold mb-1">Commentaire IA global</span>
                      <p className="text-xs text-slate-205 leading-relaxed italic">
                        "{correctionResult.originalExplanation}"
                      </p>
                    </div>

                    {/* Precise Changes List */}
                    {correctionResult.correctionsList && correctionResult.correctionsList.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-850 space-y-2">
                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block font-bold">Améliorations apportées</span>
                        <ul className="space-y-1.5 pl-0.5 animate-fadeIn">
                          {correctionResult.correctionsList.map((item, id) => (
                            <li key={id} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                              <span className="text-emerald-400 shrink-0 mt-0.5">✔</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Side-by-side proposed corrected IDE */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block font-bold">Code de Correction</span>
                      <div className="h-64 border border-slate-800 rounded bg-[#1e293b] p-1 overflow-hidden">
                        <Editor
                          height="100%"
                          language={language}
                          theme="vs-dark"
                          value={correctionResult.correctedCode}
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 11,
                            fontFamily: "JetBrains Mono, Menlo, Monaco, Courier New, monospace",
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                          }}
                        />
                      </div>
                    </div>

                  </div>

                  {/* Big action to overwrite active editor with correction */}
                  <div className="p-4 bg-indigo-600/5 mt-auto border-t border-slate-800">
                    <button
                      onClick={handleApplyCorrection}
                      className="w-full py-2.5 bg-indigo-600 rounded-lg text-xs font-bold text-white hover:bg-indigo-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20"
                    >
                      <span>Appliquer la correction</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              )}

            </aside>

          </div>
        )}

      </main>

      {/* FOOTER STATUS BAR */}
      <footer className="h-8 bg-[#1e293b]/75 border-t border-slate-800 flex items-center justify-between px-4 sticky bottom-0 z-30 shadow-md text-slate-500 shrink-0">
        <div className="flex items-center gap-5 text-[10px] font-medium">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected to Firebase Firestore
          </div>
          <div className="text-slate-505 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Expirable sous 30 jours (TTL)</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
          <span>Col 24, Row 16</span>
          <span>UTF-8</span>
          <span className="text-indigo-400 font-bold uppercase select-none">SeeMyCode v2.4</span>
        </div>
      </footer>

      {/* GENERATED SHARE MODAL */}
      {showShareModal && shareUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e2e] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-scaleUp">
            
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2.5 mb-2 uppercase tracking-wide">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>Lien d'entraide généré !</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Votre extrait de code web est sauvegardé de manière éphémère. Partagez le lien avec d'autres développeurs ou flashez le QR code pour travailler depuis votre mobile !
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-5 items-stretch">
              {/* Left actions */}
              <div className="md:col-span-3 flex flex-col justify-between gap-4">
                {/* Link input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Lien de partage</label>
                  <div className="flex items-center gap-2 bg-[#0f172a] p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 bg-transparent font-mono text-xs text-slate-300 focus:outline-none px-1 select-all outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(shareUrl, "url")}
                      className="flex items-center gap-1.2 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm transition-colors shrink-0"
                    >
                      {copiedUrlActive ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Social Sharing Dropdown Component */}
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Partage rapide</label>
                  <button
                    onClick={() => setShowSocialDropdown(!showSocialDropdown)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-xs font-bold text-slate-300 transition-all select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Partager sur les réseaux sociaux</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono transition-transform">
                      {showSocialDropdown ? "▼" : "▲"}
                    </span>
                  </button>

                  {showSocialDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#242436] border border-slate-800 rounded-xl shadow-xl z-50 p-1.5 flex flex-col gap-0.5 overflow-hidden animate-fadeIn">
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Besoin d'aide sur SeeMyCode! " + (title ? `« ${title} »` : ""))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg hover:bg-indigo-600/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Twitter className="w-3.5 h-3.5 text-sky-400" />
                        <span className="font-medium">Partager sur Twitter / X</span>
                      </a>

                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg hover:bg-indigo-600/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-medium">Partager sur LinkedIn</span>
                      </a>

                      <a
                        href={`mailto:?subject=${encodeURIComponent("Aide sur SeeMyCode : " + (title || "Code snippet"))}&body=${encodeURIComponent("Bonjour,\n\nJ'aimerais que tu examines ou corriges mon code snippet sur SeeMyCode à cette adresse :\n" + shareUrl)}`}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg hover:bg-indigo-600/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5 text-rose-400" />
                        <span className="font-medium">Envoyer par Email</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Right QR Code Section */}
              <div className="md:col-span-2 bg-[#12121a]/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col items-center justify-center text-center">
                <div className="bg-white p-2 rounded-lg shadow-inner mb-2">
                  <QRCodeSVG 
                    value={shareUrl} 
                    size={110} 
                    level="M" 
                    includeMargin={false}
                    fgColor="#0f172a"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-200">Scanner le QR Code</span>
                <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">Pour ouvrir rapidement votre code sur mobile</span>
              </div>
            </div>

            {/* Config metadata / safety disclaimer */}
            <div className="space-y-3 border-t border-[#1a1c2a] pt-5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Durée de validité</span>
                <span className="text-amber-450 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  30 Jours (jusqu'au {getExpiresLabel()})
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Méthode de stockage</span>
                {isFallbackDb ? (
                  <span className="text-indigo-400 font-bold">Local JSON DB</span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3 h-3" /> Firebase Firestore
                  </span>
                )}
              </div>

              <div className="mt-4 p-3 bg-indigo-950/20 rounded-lg text-[11px] text-indigo-300 leading-relaxed">
                ℹ️ <strong>Règle d'or :</strong> Le document d'origine restera immuable. Les correcteurs tiers utiliseront le bouton <span className="font-bold underline text-white">Fork & Edit</span> pour cloner et proposer des secondes variantes de correction sans altérer votre code initial.
              </div>
            </div>

            {/* Footer close */}
            <button
              onClick={() => setShowShareModal(false)}
              className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-xl shadow-md transition-all active:scale-98"
            >
              Fermer la fenêtre
            </button>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-[#0f172a] text-[11px] text-slate-500 px-6 py-6 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
          <div>
            <span>© 2026 SeeMyCode • Construit pour l'entraide web</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Validité : 1 mois (expiresAt)</span>
            <span>•</span>
            <span>Purge Native TTL Firestore</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
