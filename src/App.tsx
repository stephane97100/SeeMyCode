import React, { useState, useEffect, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { QRCodeSVG } from "qrcode.react";
import {
  Terminal,
  History,
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
  Eye,
  Maximize2,
  Minimize2,
  LogOut,
  User,
  Users,
  Unlock,
  Layers,
  Sparkle,
  Key,
  EyeOff,
  X
} from "lucide-react";
import { db, auth } from "./firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, updateDoc, setDoc, deleteDoc, collection, serverTimestamp } from "firebase/firestore";
import AuthModal from "./components/AuthModal";
import { DocSnippet, CoEditor, CorrectionResult } from "./types";
import LanguageSelector, { SUPPORTED_LANGUMENTS } from "./components/LanguageSelector";

const EDITOR_THEMES = [
  { value: "vs-dark", label: "Sombre classique" },
  { value: "light", label: "Clair classique" },
  { value: "monokai", label: "Monokai Pro" },
  { value: "solarized-dark", label: "Solarized Sombre" },
  { value: "solarized-light", label: "Solarized Clair" },
  { value: "dracula", label: "Dracula Gothic" },
];

// Redundant local type interfaces have been refactored and central-imported from "./types" for clean schema compliance.

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
          <span class="badge">${language === "react" ? "React (TSX)" : language.toUpperCase()}</span>
          <h1>Remplaçant Console dynamique</h1>
          <p>
            Le langage <strong>${language === "react" ? "React (TSX)" : language}</strong> s'exécute côté serveur ou nécessite une machine virtuelle dédiée. L'exécution dynamique en direct (Live Sandbox) n'est pas supportée nativement dans une iframe client standard.
          </p>
          <p style="margin-top: 12px; opacity: 0.8; font-size: 12px;">
            Utilisez <strong>HTML</strong>, <strong>CSS</strong>, <strong>JavaScript</strong> ou <strong>Markdown</strong> pour obtenir un rendu visuel en temps réel et interactif !
          </p>
        </div>
      </body>
    </html>
  `;
}

const FUN_NAMES = ["Hibou", "Tigre", "Renard", "Lynx", "Castor", "Panda", "Koala", "Pingouin", "Loutre", "Faucon", "Cerf", "Dauphin", "Lion", "Aigle"];
const PASTEL_COLORS = ["#f87171", "#fb923c", "#fbbf24", "#34d399", "#2dd4bf", "#38bdf8", "#60a5fa", "#818cf8", "#a78bfa", "#f472b6"];

const generateGuestProfile = () => {
  const animal = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
  const color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
  const digits = Math.floor(Math.random() * 900) + 100;
  const guestId = "guest_" + Math.random().toString(36).substring(2, 9);
  return {
    uid: guestId,
    displayName: `Codeur anonyme (${animal}) #${digits}`,
    color: color
  };
};

export default function App() {
  // Navigation / Loading States
  const [snippetId, setSnippetId] = useState<string | null>(null);
  const [isLoadingSnippet, setIsLoadingSnippet] = useState(false);
  const [snippetError, setSnippetError] = useState<string | null>(null);

  // Authentication & Guest Profile States
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [sessionUser, setSessionUser] = useState<{ uid: string; displayName: string; color: string }>(() => {
    const saved = sessionStorage.getItem("seemycode_guest_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    const generated = generateGuestProfile();
    sessionStorage.setItem("seemycode_guest_profile", JSON.stringify(generated));
    return generated;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Gemini and User custom states
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [showApiKeyPromptModal, setShowApiKeyPromptModal] = useState(false);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState("");
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Collaboration and Lock states
  const [coEditors, setCoEditors] = useState<CoEditor[]>([]);
  const [currentLock, setCurrentLock] = useState<{
    activeEditorUid: string | null;
    activeEditorName: string | null;
    activeEditorExpires: number | null;
  }>({
    activeEditorUid: null,
    activeEditorName: null,
    activeEditorExpires: null,
  });

  // Editor State
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [title, setTitle] = useState("");
  const [parentCodeId, setParentCodeId] = useState<string | null>(null);

  // Pre-defined Custom Syntax Highlighting Themes state
  const [editorTheme, setEditorTheme] = useState(() => localStorage.getItem("seemycode_editor_theme") || "vs-dark");

  // Version History Lineage family states
  const [snippetVersions, setSnippetVersions] = useState<DocSnippet[]>([]);
  const [originalLoadedCode, setOriginalLoadedCode] = useState("");

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

  // Mode Lecture Seule (Dynamically locked if another co-editor is holding the typing token)
  const isEditingLockedByOther = !!snippetId && 
                                 currentLock.activeEditorUid !== null && 
                                 currentLock.activeEditorUid !== (user ? user.uid : sessionUser.uid) && 
                                 currentLock.activeEditorExpires !== null && 
                                 Date.now() < currentLock.activeEditorExpires;

  const isReadOnlyMode = isEditingLockedByOther;
  const isCollabMode = !!snippetId;

  // Real-time Linting / Diagnostics States
  const [showLinting, setShowLinting] = useState(true);
  const [markers, setMarkers] = useState<any[]>([]);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState(false);

  // Active View Tab: Code Editor vs Real-time HTML Preview
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // Force activeTab to "code" for server-side interpreted languages
  useEffect(() => {
    if (["react", "csharp", "php", "python"].includes(language)) {
      setActiveTab("code");
    }
  }, [language]);

  // Listen for Escape key to exit fullscreen preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreenPreview(false);
      }
    };
    if (isFullscreenPreview) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreenPreview]);

  // Refs to reference the editor instance locally
  const editorRef = useRef<any>(null);

  const monaco = useMonaco();

  // Define custom editor themes in Monaco
  useEffect(() => {
    if (!monaco) return;

    // Define Monokai Pro
    monaco.editor.defineTheme("monokai", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "75715E", fontStyle: "italic" },
        { token: "keyword", foreground: "F92672" },
        { token: "number", foreground: "AE81FF" },
        { token: "string", foreground: "E6DB74" },
        { token: "type", foreground: "66D9EF" },
        { token: "class", foreground: "A6E22E" },
        { token: "function", foreground: "A6E22E" },
        { token: "variable", foreground: "F8F8F2" },
      ],
      colors: {
        "editor.background": "#272822",
        "editor.foreground": "#f8f8f2",
        "editorCursor.foreground": "#f8f8f0",
        "editor.lineHighlightBackground": "#3E3D32",
        "editorLineNumber.foreground": "#90908a",
      },
    });

    // Define Solarized Dark
    monaco.editor.defineTheme("solarized-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "586e75", fontStyle: "italic" },
        { token: "keyword", foreground: "859900" },
        { token: "number", foreground: "d33682" },
        { token: "string", foreground: "2aa198" },
        { token: "type", foreground: "b58900" },
        { token: "class", foreground: "268bd2" },
        { token: "function", foreground: "268bd2" },
        { token: "variable", foreground: "839496" },
      ],
      colors: {
        "editor.background": "#002b36",
        "editor.foreground": "#839496",
        "editorCursor.foreground": "#839496",
        "editor.lineHighlightBackground": "#073642",
        "editorLineNumber.foreground": "#586e75",
      },
    });

    // Define Solarized Light
    monaco.editor.defineTheme("solarized-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "93a1a1", fontStyle: "italic" },
        { token: "keyword", foreground: "859900" },
        { token: "number", foreground: "d33682" },
        { token: "string", foreground: "2aa198" },
        { token: "type", foreground: "b58900" },
        { token: "class", foreground: "268bd2" },
        { token: "function", foreground: "268bd2" },
        { token: "variable", foreground: "586e75" },
      ],
      colors: {
        "editor.background": "#fdf6e3",
        "editor.foreground": "#586e75",
        "editorCursor.foreground": "#002b36",
        "editor.lineHighlightBackground": "#eee8d5",
        "editorLineNumber.foreground": "#93a1a1",
      },
    });

    // Define Dracula Gothic
    monaco.editor.defineTheme("dracula", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6272a4", fontStyle: "italic" },
        { token: "keyword", foreground: "ff79c6" },
        { token: "number", foreground: "bd93f9" },
        { token: "string", foreground: "f1fa8c" },
        { token: "type", foreground: "8be9fd" },
        { token: "class", foreground: "50fa7b" },
        { token: "function", foreground: "50fa7b" },
        { token: "variable", foreground: "f8f8f2" },
      ],
      colors: {
        "editor.background": "#282a36",
        "editor.foreground": "#f8f8f2",
        "editorCursor.foreground": "#f8f8f2",
        "editor.lineHighlightBackground": "#44475a",
        "editorLineNumber.foreground": "#6272a4",
      },
    });
  }, [monaco]);

  // Persist selected theme
  useEffect(() => {
    localStorage.setItem("seemycode_editor_theme", editorTheme);
  }, [editorTheme]);

  // Fetch version history family list
  const fetchSnippetVersions = async (id: string) => {
    try {
      const res = await fetch(`/api/snippets/${id}/versions`);
      if (res.ok) {
        const list = await res.json();
        setSnippetVersions(list || []);
      }
    } catch (err) {
      console.warn("Failed to retrieve versions lineage:", err);
    }
  };

  const handleLoadVersion = (versionId: string) => {
    window.history.pushState(null, "", `/code/${versionId}`);
    setSnippetId(versionId);
    fetchSharedSnippet(versionId);
  };

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

  // Performance-optimal stability refs for real-time Firestore listeners
  const codeRef = useRef(code);
  const languageRef = useRef(language);
  const titleRef = useRef(title);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  // Auth Status Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // User Profile Observer (for fetching stored Gemini API key)
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setGeminiApiKeyInput("");
      return;
    }
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserProfile(data);
        setGeminiApiKeyInput(data?.geminiApiKey || "");
      } else {
        setUserProfile(null);
        setGeminiApiKeyInput("");
      }
    }, (err) => {
      console.warn("User profile not yet created or accessible:", err);
    });
    return () => unsubscribe();
  }, [user]);

  // Real-time Collaboration, Lock Claim and Presence Heartbeat
  useEffect(() => {
    if (!snippetId) {
      setCoEditors([]);
      setCurrentLock({ activeEditorUid: null, activeEditorName: null, activeEditorExpires: null });
      return;
    }

    const myUid = user ? user.uid : sessionUser.uid;
    const myDisplayName = user ? user.displayName : sessionUser.displayName;
    const myColor = sessionUser.color;
    const myPhotoURL = user?.photoURL || "";

    // A. Heartbeat registration
    const registerPresence = async () => {
      try {
        const presenceRef = doc(db, "snippets", snippetId, "presence", myUid);
        await setDoc(presenceRef, {
          uid: myUid,
          displayName: myDisplayName,
          color: myColor,
          lastActive: Date.now(),
          photoURL: myPhotoURL
        });
      } catch (e) {
        // Safe silence in case of connection drop
      }
    };

    registerPresence();
    const presenceTimer = setInterval(registerPresence, 4000);

    // B. Subscribing to presence listings (clean up stale co-editors automatically)
    const presenceCol = collection(db, "snippets", snippetId, "presence");
    const unsubscribePresence = onSnapshot(presenceCol, (snapshot) => {
      const list: CoEditor[] = [];
      const now = Date.now();
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d && d.uid && now - d.lastActive < 15000) {
          list.push({
            uid: d.uid,
            displayName: d.displayName,
            color: d.color,
            lastActive: d.lastActive,
            photoURL: d.photoURL || ""
          });
        }
      });
      setCoEditors(list);
    }, (err) => {
      console.error("Presence subscription warning:", err);
    });

    // C. Subscribe to Code Snippet changes
    const snippetRef = doc(db, "snippets", snippetId);
    const unsubscribeSnippet = onSnapshot(snippetRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as DocSnippet;
        
        const lockUid = data.activeEditorUid || null;
        const lockName = data.activeEditorName || null;
        const lockExpires = data.activeEditorExpires || null;

        setCurrentLock({
          activeEditorUid: lockUid,
          activeEditorName: lockName,
          activeEditorExpires: lockExpires
        });

        // Determine if editing is currently occupied
        const isOccupiedByOther = lockUid !== null && lockUid !== myUid && lockExpires !== null && Date.now() < lockExpires;

        if (isOccupiedByOther || lockUid === null) {
          if (data.code !== undefined && data.code !== codeRef.current) {
            setCode(data.code);
          }
        }

        if (data.language && data.language !== languageRef.current) {
          setLanguage(data.language);
        }
        if (data.title && data.title !== titleRef.current) {
          setTitle(data.title);
        }
        if (data.tags) {
          setLoadedTags(data.tags);
        }
      }
    }, (err) => {
      console.error("Snippet synchronization warning:", err);
    });

    // D. Cleanup hooks
    return () => {
      clearInterval(presenceTimer);
      unsubscribePresence();
      unsubscribeSnippet();
      deleteDoc(doc(db, "snippets", snippetId, "presence", myUid)).catch(() => {});
    };
  }, [snippetId, user, sessionUser]);

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
  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    // Only replace if current code is standard placeholder of another language or empty
    const isPlaceholder = SUPPORTED_LANGUMENTS.some(l => l.placeholder.trim() === code.trim() || code.trim() === "");
    let updatedCode = code;
    if (isPlaceholder || code === "") {
      const targetLang = SUPPORTED_LANGUMENTS.find(l => l.value === newLang);
      updatedCode = targetLang?.placeholder || "";
      setCode(updatedCode);
    }

    if (snippetId) {
      try {
        const snipRef = doc(db, "snippets", snippetId);
         await updateDoc(snipRef, {
          language: newLang,
          code: updatedCode
        });
      } catch (err) {
        console.error("Failed to sync language selection:", err);
      }
    }
  };

  // Co-editing lock touch and debounced Firestore sync
  const lastLockTouchRef = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const releaseLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFirestoreCollabWrite = (newCode: string) => {
    if (!snippetId) return;

    const myUid = user ? user.uid : sessionUser.uid;
    const myDisplayName = user ? user.displayName : sessionUser.displayName;

    // 1. Touch lock to claim/renew it immediately (runs once every 2 seconds during typing)
    if (Date.now() - lastLockTouchRef.current > 2000) {
      lastLockTouchRef.current = Date.now();
      const snipRef = doc(db, "snippets", snippetId);
      updateDoc(snipRef, {
        activeEditorUid: myUid,
        activeEditorName: myDisplayName,
        activeEditorExpires: Date.now() + 6000 // lock valid for 6 seconds
      }).catch((e) => console.warn("Lock claim failed:", e));
    }

    // 2. Debounce code payload write to Firestore
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const snipRef = doc(db, "snippets", snippetId);
        await updateDoc(snipRef, {
          code: newCode,
          activeEditorUid: myUid,
          activeEditorName: myDisplayName,
          activeEditorExpires: Date.now() + 6000
        });
      } catch (err) {
        console.warn("Debounced Firestore saving failed:", err);
      }
    }, 450); // 450ms debounce keeps the collab view highly real-time while maintaining strict quota counts

    // 3. Auto-release lock after 3.5 seconds of silence
    if (releaseLockTimeoutRef.current) {
      clearTimeout(releaseLockTimeoutRef.current);
    }
    releaseLockTimeoutRef.current = setTimeout(async () => {
      try {
        const snipRef = doc(db, "snippets", snippetId);
        await updateDoc(snipRef, {
          activeEditorUid: null,
          activeEditorExpires: null
        });
        lastLockTouchRef.current = 0;
      } catch (e) {
        // ignore
      }
    }, 3500);
  };

  const handleEditorChange = (val: string | undefined) => {
    const newCode = val || "";
    setCode(newCode);

    // Keep published snippets immutable! Real-time typing changes are local drafts
    // until explicitly shared/published as a new linked version.
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
      setOriginalLoadedCode(data.code);
      setLanguage(data.language);
      setTitle(data.title || "");
      setParentCodeId(data.parentCodeId || null);
      setLoadedTags(data.tags || []);
      setTagInput(data.tags ? data.tags.join(", ") : "");
      
      // Fetch version lineage family
      fetchSnippetVersions(id);
    } catch (err: any) {
      console.error(err);
      setSnippetError(err.message || "Erreur de chargement.");
    } finally {
      setIsLoadingSnippet(false);
    }
  };

  // save Gemini API Key to profile in Firestore
  const handleSaveGeminiApiKey = async (customKey: string) => {
    if (!user) return;
    setIsSavingApiKey(true);
    setApiKeyError(null);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0] || "Membre",
        createdAt: user.metadata.creationTime || new Date().toISOString(),
        geminiApiKey: customKey.trim()
      }, { merge: true });
      setShowSettingsModal(false);
      setShowApiKeyPromptModal(false);
    } catch (err: any) {
      console.error("Error saving Gemini API key:", err);
      setApiKeyError(err.message || "Erreur de base de données. Impossible d'enregistrer.");
    } finally {
      setIsSavingApiKey(false);
    }
  };

  // call Gemini correction api
  const handleCorrectCode = async (explicitKey?: string) => {
    if (!code.trim()) return;

    // 1. Unregistered user check (s'il n'est pas enregistré alors il ne pourra que partager son code)
    if (!user) {
      setShowRestrictionModal(true);
      return;
    }

    // 2. Missing API key check (demande à chaque utilisateur enregistré sa clef api gémini)
    const activeKey = explicitKey || userProfile?.geminiApiKey;
    if (!activeKey) {
      setApiKeyError(null);
      // pre-load whatever might be in the state input
      setGeminiApiKeyInput(userProfile?.geminiApiKey || "");
      setShowApiKeyPromptModal(true);
      return;
    }

    setIsCorrecting(true);
    setCorrectionResult(null);
    setCorrectionError(null);

    try {
      const response = await fetch("/api/correct", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": activeKey.trim()
        },
        body: JSON.stringify({ 
          code, 
          language,
          geminiApiKey: activeKey.trim() 
        })
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
          tags: tagsArray,
          ownerId: user?.uid || null,
          ownerName: user?.displayName || user?.email || null
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
          
          <div className="hidden md:flex items-center w-40">
            <LanguageSelector
              value={language}
              onChange={handleLanguageChange}
              disabled={isReadOnlyMode}
              size="sm"
            />
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
              className="flex items-center gap-2 px-3.5 py-2 bg-[#4f46e5] text-white hover:bg-[#4338ca] rounded-lg text-xs font-bold transition-all disabled:opacity-40"
              id="share-btn"
            >
              {isSharing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>{snippetId && code !== originalLoadedCode ? "Save Version" : "Share"}</span>
            </button>
          )}

          <button
            onClick={handleCorrectCode}
            disabled={isCorrecting || !code.trim() || !user || !userProfile?.geminiApiKey}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700/80 disabled:shadow-none disabled:cursor-not-allowed"
            title={
              !user 
                ? "Correction IA indisponible : Veuillez vous connecter pour utiliser votre propre clé Gemini" 
                : !userProfile?.geminiApiKey 
                ? "Correction IA indisponible : Clé API Gemini manquante dans vos paramètres" 
                : "Corriger le code avec Gemini"
            }
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
            className="p-2 bg-slate-800 hover:bg-slate-755 border border-slate-720 rounded-lg text-slate-400 hover:text-white shrink-0 cursor-pointer"
            title="Aide & explications TTL"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Authentication interface section */}
          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block shrink-0" />

           {user ? (
            <div className="flex items-center gap-2.5 shrink-0 animate-fadeIn">
              <div 
                className="hidden md:flex flex-col items-end text-right"
                title={`Connecté en tant que ${user.email}`}
              >
                <span className="text-xs font-bold text-white leading-none">{user.displayName || user.email?.split("@")[0]}</span>
                <span className="text-[9px] text-indigo-400 font-mono tracking-wider font-semibold uppercase mt-0.5">Membre</span>
              </div>
              
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "Avatar"} 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg border border-slate-700 hover:border-indigo-500 transition-all object-cover ring-1 ring-slate-800"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-lg bg-[#4f46e5]/40 border border-[#4f46e5]/50 flex items-center justify-center text-xs font-bold font-sans text-indigo-300 capitalize shadow-md"
                >
                  {(user.displayName || user.email || "U").charAt(0)}
                </div>
              )}

              <button
                onClick={() => {
                  setGeminiApiKeyInput(userProfile?.geminiApiKey || "");
                  setApiKeyError(null);
                  setShowSettingsModal(true);
                }}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-720 hover:border-amber-500/50 text-slate-400 hover:text-amber-400 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                title="Mon Espace & Clé API Gemini"
                id="user-settings-btn"
              >
                <Key className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="hidden xl:inline text-[9px] font-bold font-mono tracking-wider uppercase">Clé API</span>
              </button>

              <button
                onClick={() => signOut(auth)}
                className="p-2 bg-slate-800/80 hover:bg-red-950/40 hover:text-red-400 border border-slate-720 hover:border-red-900/40 text-slate-400 rounded-lg transition-all cursor-pointer"
                title="Déconnexion SeeMyCode"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600 hover:text-white border border-indigo-505/30 hover:border-indigo-500 rounded-lg text-xs font-bold text-indigo-400 transition-all cursor-pointer shrink-0"
              id="header-login-btn"
            >
              <User className="w-3.5 h-3.5" />
              <span>Se connecter</span>
            </button>
          )}
        </div>
      </nav>

      {/* IMMUTABLE DRAFT BANNER */}
      {snippetId && code !== originalLoadedCode && (
        <div className="bg-[#4f46e5]/10 border-b border-[#4f46e5]/20 px-6 py-2.5 text-xs font-sans text-indigo-300 shrink-0 animate-fadeIn">
          <div className="w-full flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>
                <strong>Mode brouillon :</strong> Vous personnalisez ce code partagé. L'original restera <strong>intact</strong> (immuable). Enregistrez pour créer la <strong>version {snippetVersions.length + 1}</strong> !
              </span>
            </div>
            <button
              onClick={handleShareSnippet}
              disabled={isSharing}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-505 text-white font-bold px-3 py-1 rounded text-[11px] transition-all cursor-pointer shadow border border-indigo-500/30"
            >
              <Share2 className="w-3 h-3 text-white" />
              <span>Publier Version {snippetVersions.length + 1}</span>
            </button>
          </div>
        </div>
      )}

      {/* REAL-TIME COLLABORATION AND CONCURRENT LOCK BANNER */}
      {isCollabMode && !isLoadingSnippet && !snippetError && (
        <div className={`border-b border-slate-800/80 px-6 py-2 text-xs font-sans shrink-0 transition-all ${
          isReadOnlyMode 
            ? "bg-amber-500/10 text-amber-300" 
            : "bg-emerald-500/10 text-emerald-300"
        }`}>
          <div className="w-full flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                isReadOnlyMode ? "bg-amber-400" : "bg-emerald-400"
              }`} />
              <span className="font-sans leading-relaxed">
                {isReadOnlyMode ? (
                  <>
                    <strong>Co-édition verrouillée :</strong> {currentLock.activeEditorName || "Un collaborateur"} est en train d'écrire. L'éditeur est temporairement réservé pour éviter les conflits d'écritures.
                  </>
                ) : (
                  <>
                    <strong>Session collaborative active :</strong> Partagez ce lien avec vos pairs et co-codez en direct ! (Source de vérité : Firestore)
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              {coEditors.length > 1 && (
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {coEditors.length} actifs
                </span>
              )}
              <button
                onClick={handleFork}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium px-3 py-1 rounded border border-slate-700 text-[11px] transition-all cursor-pointer"
              >
                <GitFork className="w-3 h-3 text-indigo-400" />
                <span>Forker ce code</span>
              </button>
            </div>
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
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <div className="w-40 shrink-0">
                        <LanguageSelector
                          value={language}
                          onChange={handleLanguageChange}
                          disabled={isReadOnlyMode}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-800 rounded px-2 py-0.5 border border-slate-705">
                        <span className="text-[10px] font-medium text-slate-400 font-mono">THEME:</span>
                        <select
                          value={editorTheme}
                          onChange={(e) => setEditorTheme(e.target.value)}
                          className="bg-transparent text-[11px] font-bold text-slate-201 outline-none cursor-pointer"
                        >
                          {EDITOR_THEMES.map((t) => (
                            <option key={t.value} value={t.value} className="bg-[#1e293b]">
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
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

              {/* Editor Workspace & History Sidebar container */}
              <div className="flex flex-col lg:flex-row gap-4 flex-1 items-stretch min-h-[450px] lg:min-h-0 lg:h-full">
                
                {/* Version History Lineage Sidebar */}
                {snippetId && snippetVersions.length > 0 && (
                  <div className="w-full lg:w-48 bg-[#152033]/65 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs select-none uppercase font-mono tracking-wider border-b border-slate-800/85 pb-2">
                      <History className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Versions ({snippetVersions.length})</span>
                    </div>
                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto max-h-48 lg:max-h-[385px] xl:max-h-[420px] pr-1.5 pb-2 lg:pb-0 scrollbar-thin">
                      {snippetVersions.map((v, idx) => {
                        const isActive = v.id === snippetId;
                        const dateObj = new Date(v.createdAt);
                        const dateLabel = isNaN(dateObj.getTime()) ? "Récemment" : dateObj.toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        }) + " " + dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleLoadVersion(v.id)}
                            className={`flex flex-col items-start gap-1 p-2.5 rounded-lg border text-left cursor-pointer transition-all min-w-[130px] lg:min-w-0 ${
                              isActive
                                ? "bg-indigo-650/45 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                                : "bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-850/60 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full gap-1">
                              <span className="text-[11px] font-mono font-bold">
                                Version {idx === 0 ? "1 (Initiale)" : `${idx + 1}`}
                              </span>
                              {v.id === parentCodeId && (
                                <span className="text-[8px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1 rounded font-mono font-semibold uppercase">
                                  Parent
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate font-sans">
                              {v.title || "Version sans titre"}
                            </span>
                            <span className="text-[9px] text-slate-600 block shrink-0 font-mono">
                              {dateLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                        onClick={() => {
                          if (!["react", "csharp", "php", "python"].includes(language)) {
                            setActiveTab("preview");
                          }
                        }}
                        disabled={["react", "csharp", "php", "python"].includes(language)}
                        className={`flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                          ["react", "csharp", "php", "python"].includes(language)
                            ? "opacity-30 cursor-not-allowed text-slate-500"
                            : activeTab === "preview"
                            ? "bg-indigo-600 text-white shadow-sm cursor-pointer"
                            : "text-slate-400 hover:text-slate-200 cursor-pointer"
                        }`}
                        title={["react", "csharp", "php", "python"].includes(language) ? "Aperçu indisponible (langage interprété côté serveur)" : "Rendu visuel dynamique"}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Aperçu</span>
                      </button>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-bold">
                    {activeTab === "code" ? `editor.${language === "react" ? "tsx" : language}` : "preview.html"} {isReadOnlyMode ? '— readonly' : ''}
                  </span>
                  
                  {/* Real-time Syntax Check Gutter Switch Toggle / Fullscreen Button */}
                  <div className="flex items-center gap-2">
                    {activeTab === "preview" ? (
                      <button
                        onClick={() => setIsFullscreenPreview(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-650 text-indigo-305 hover:text-white border border-indigo-505/30 hover:border-indigo-500/50 rounded-lg text-[10px] font-bold tracking-wide transition-all select-none cursor-pointer"
                        title="Voir la démo en Plein Écran"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Plein écran</span>
                      </button>
                    ) : (
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
                    )}
                  </div>
                </div>

                {activeTab === "code" ? (
                  <div className="flex-1 min-h-[380px] lg:min-h-0 lg:h-full p-2 bg-[#1e293b]">
                    <Editor
                      height="100%"
                      language={language === "react" ? "typescript" : (language === "twig" ? "html" : language)}
                      theme={editorTheme}
                      value={code}
                      onChange={handleEditorChange}
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

                {/* Floating full-screen button for Preview */}
                {activeTab === "preview" && (
                  <button
                    onClick={() => setIsFullscreenPreview(true)}
                    className="absolute right-4 bottom-4 z-10 p-2.5 bg-slate-900/95 border border-slate-700/80 rounded-lg hover:bg-indigo-600 hover:border-indigo-500 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                    title="Agrandir en Plein Écran"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-450" />
                    <span className="text-[10px] font-bold font-mono">Plein écran</span>
                  </button>
                )}
              </div>

               {/* Closing Editor Workspace Container */}
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
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleCorrectCode}
                    disabled={isCorrecting || !code.trim() || !user || !userProfile?.geminiApiKey}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/10 transition-all disabled:opacity-40 disabled:bg-slate-800/80 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed text-xs uppercase"
                    id="correct-code-btn"
                    title={
                      !user 
                        ? "Correction IA : Connexion requise" 
                        : !userProfile?.geminiApiKey 
                        ? "Correction IA : Clé API Gemini manquante" 
                        : "Corriger et analyser mon code par IA"
                    }
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
                        <span>{snippetId && code !== originalLoadedCode ? "Publier nouvelle version" : "Share on Cloud (1 mois)"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {(!user || !userProfile?.geminiApiKey) && (
                <div className="mt-1 text-center bg-slate-900/40 border border-slate-800/70 p-2.5 rounded-xl animate-fadeIn">
                  {!user ? (
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Pour débloquer l'aide IA, veuillez{" "}
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer inline-block"
                      >
                        vous connecter
                      </button>{" "}
                      et configurer votre clé Gemini personnelle.
                    </p>
                  ) : !userProfile?.geminiApiKey ? (
                    <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
                      Votre compte est connecté. Veuillez{" "}
                      <button
                        onClick={() => {
                          setGeminiApiKeyInput("");
                          setApiKeyError(null);
                          setShowSettingsModal(true);
                        }}
                        className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer inline-block"
                      >
                        configurer votre clé API Gemini
                      </button>{" "}
                      dans vos paramètres pour activer la correction IA.
                    </p>
                  ) : null}
                </div>
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
                        <LanguageSelector
                          value={searchLanguage}
                          onChange={(newVal) => setSearchLanguage(newVal)}
                          showAllOption={true}
                        />
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
                          language={language === "react" ? "typescript" : (language === "twig" ? "html" : language)}
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

      {/* FULLSCREEN PREVIEW OVERLAY */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 bg-[#0f172a] z-50 flex flex-col p-4 md:p-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Aperçu de l'application</span>
                <span className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30 rounded text-[10px] font-mono text-indigo-300 font-semibold uppercase">{language}</span>
              </h3>
            </div>

            <button
              onClick={() => setIsFullscreenPreview(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-100 font-bold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quitter le plein écran (<kbd className="font-mono text-[10px] bg-slate-900 px-1 py-0.5 rounded border border-slate-700">Échap</kbd>)</span>
            </button>
          </div>

          {/* Canvas-like live preview iframe container */}
          <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800">
            <iframe
              title="SeeMyCode Fullscreen Live Preview"
              srcDoc={getPreviewDoc(code, language)}
              sandbox="allow-scripts"
              className="w-full h-full border-none bg-white absolute inset-0"
            />
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

      {/* AUTHENTICATION CONTEXT MODAL */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* USER SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#1e1e2e] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-scaleUp text-slate-200">
            <button
              onClick={() => {
                setShowSettingsModal(false);
                setApiKeyError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-2 uppercase tracking-wide">
              <Key className="w-4 h-4 text-amber-500" />
              <span>Ma Clé API Gemini</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Renseignez votre clé API Gemini personnelle (v1.5 / v2.0 ou v3.5) pour pouvoir exécuter des suggestions et des corrections automatiques de code par IA depuis SeeMyCode. Votre clé est enregistrée de manière confidentielle dans votre espace Firestore privé.
            </p>

            {apiKeyError && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-4 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{apiKeyError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                  Saisir votre Clé API Gemini
                </label>
                <div className="relative flex items-center bg-[#0f172a] rounded-xl border border-slate-800">
                  <input
                    type={apiKeyVisible ? "text" : "password"}
                    value={geminiApiKeyInput}
                    onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-transparent font-mono text-xs text-slate-300 focus:outline-none pl-3.5 pr-10 py-3 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    className="absolute right-3 text-slate-500 hover:text-slate-300 p-1 rounded-md transition-colors"
                  >
                    {apiKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSavingApiKey}
                  onClick={() => handleSaveGeminiApiKey(geminiApiKeyInput)}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-505 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingApiKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>Enregistrer</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setApiKeyError(null);
                  }}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  Fermer
                </button>
              </div>

              {userProfile?.geminiApiKey && (
                <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                    <Check className="w-3.5 h-3.5" /> Clé active et mémorisée
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setGeminiApiKeyInput("");
                      handleSaveGeminiApiKey("");
                    }}
                    className="text-red-400 hover:underline hover:text-red-300 font-mono text-[10px] uppercase font-bold"
                  >
                    Effacer la clé
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GUEST MODE RESTRICTION WARNING */}
      {showRestrictionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#1e1e2e] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-scaleUp text-slate-200">
            <button
              onClick={() => setShowRestrictionModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mt-2 mb-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-3.5">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold/80 text-slate-100 uppercase tracking-wide">
                Correction assistée par l'IA
              </h3>
              <p className="text-xs text-red-400 font-bold mt-1.5">Fonctionnalité réservée aux membres connectés</p>
            </div>

            <p className="text-xs text-slate-450 leading-relaxed text-center mb-6">
              Les visiteurs anonymes ont la possibilité d'éditer le code et de le partager avec la communauté. Cependant, l'<strong>analyse de bugs, l'assistance technique et la correction automatique par intelligence artificielle Gemini</strong> nécessitent d'être connecté et d'utiliser votre propre clé API.
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRestrictionModal(false);
                  setShowAuthModal(true);
                }}
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Créer un compte ou Se connecter</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRestrictionModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all text-center cursor-pointer"
              >
                Continuer en mode lecture seule IA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MISSING USER API DECLARED PROMPT */}
      {showApiKeyPromptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#1e1e2e] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-scaleUp text-slate-200">
            <button
              onClick={() => {
                setShowApiKeyPromptModal(false);
                setApiKeyError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mt-2 mb-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 mb-3">
                <Sparkles className="w-6 h-6 animate-pulse text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Clé API Gemini requise
              </h3>
              <p className="text-xs text-amber-400 font-semibold mt-1">Exécutez vos requêtes avec votre propre clé</p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed text-center mb-5 font-sans">
              Pour des raisons de quota et d'impartialité, SeeMyCode n'offre pas de clé partagée globale. Renseignez votre propre clé de développeur Google Gemini pour lancer l'analyse de votre code. Elle sera mémorisée de manière sécurisée dans votre profil.
            </p>

            {apiKeyError && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-4 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{apiKeyError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono text-left">
                  Saisir votre Clé API Gemini
                </label>
                <div className="relative flex items-center bg-[#0f172a] rounded-xl border border-slate-800">
                  <input
                    type={apiKeyVisible ? "text" : "password"}
                    value={geminiApiKeyInput}
                    onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-transparent font-mono text-xs text-slate-300 focus:outline-none pl-3.5 pr-10 py-3 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    className="absolute right-3 text-slate-500 hover:text-slate-300 p-1 rounded-md transition-colors"
                  >
                    {apiKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={isSavingApiKey || !geminiApiKeyInput.trim()}
                  onClick={async () => {
                    const keyToSave = geminiApiKeyInput.trim();
                    await handleSaveGeminiApiKey(keyToSave);
                    handleCorrectCode(keyToSave);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-505 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSavingApiKey ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>Confirmer & Lancer la correction</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowApiKeyPromptModal(false);
                    setApiKeyError(null);
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
