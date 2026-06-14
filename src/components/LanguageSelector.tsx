import React, { useState, useRef, useEffect } from "react";
import {
  Globe,
  Braces,
  Code2,
  Terminal,
  Cpu,
  Database,
  FileText,
  Layers,
  FileCode,
  ChevronDown,
  Check,
  Search
} from "lucide-react";

// The same languages list for consistency
export const SUPPORTED_LANGUMENTS = [
  { value: "html", label: "HTML", placeholder: "<!-- Saisissez votre code HTML ici -->\n<div class='card'>\n  <h1>Bonjour !</h1>\n</div>" },
  { value: "css", label: "CSS", placeholder: "/* Styles CSS */\n.card {\n  background: #3b82f6;\n  padding: 1rem;\n  border-radius: 8px;\n}" },
  { value: "javascript", label: "JavaScript", placeholder: "// Code JS\nfunction calculateSum(a, b) {\n  return a + b;\n}\nconsole.log(calculateSum(5, 10));" },
  { value: "typescript", label: "TypeScript", placeholder: "// Code TS\ninterface User {\n  id: number;\n  name: string;\n}\nconst greet = (u: User): string => `Hello ${u.name}`;" },
  { value: "react", label: "React (TSX)", placeholder: "import React, { useState } from 'react';\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <div className=\"p-4 flex flex-col items-center justify-center bg-slate-900 text-white rounded-xl min-h-[150px]\">\n      <p className=\"text-sm font-mono text-slate-400 mb-2\">Composant React en action</p>\n      <button \n        onClick={() => setCount(count + 1)}\n        className=\"px-4 py-2 bg-indigo-600 hover:bg-indigo-555 rounded-lg font-bold text-xs shadow transition-all\"\n      >\n        Incrémenter : {count}\n      </button>\n    </div>\n  );\n}" },
  { value: "python", label: "Python", placeholder: "# Script Python - Détermination des nombres premiers\ndef find_primes(limit):\n    primes = []\n    for num in range(2, limit + 1):\n        is_prime = True\n        for i in range(2, int(num ** 0.5) + 1):\n            if num % i == 0:\n                is_prime = False\n                break\n        if is_prime:\n            primes.append(num)\n    return primes\n\n# Affichage du résultat\nprint(\"Nombres premiers jusqu'à 20 :\", find_primes(20))" },
  { value: "php", label: "PHP", placeholder: "<?php\n// Script PHP\n$items = ['HTML', 'CSS', 'JS'];\nforeach ($items as $item) {\n    echo \"Skill: $item\\n\";\n}" },
  { value: "csharp", label: "ASP.NET (C#)", placeholder: "using System;\n// ASP.NET C# class\npublic class Program {\n    public static void Main() {\n        Console.WriteLine(\"Hello World from ASP.NET C#\");\n    }\n}" },
  { value: "twig", label: "Twig", placeholder: "{# Modèle Twig #}\n{% for article in articles %}\n  <article class=\"post\">\n    <h2>{{ article.title }}</h2>\n    <p>{{ article.summary }}</p>\n  </article>\n{% endfor %}" },
  { value: "markdown", label: "Markdown", placeholder: "# Mon Snippet\n\n- Liste point 1\n- Liste point 2\n\n```js\nconsole.log('Hello');\n```" }
];

export function getLanguageIcon(label: string, value: string) {
  const normLabel = label.toLowerCase();
  const normValue = value.toLowerCase();

  if (normLabel.includes("html") && !normLabel.includes("twig")) {
    return <Globe className="w-4 h-4 text-orange-500 shrink-0" />;
  }
  if (normLabel.includes("twig")) {
    return <Layers className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  if (normValue === "css") {
    return <Braces className="w-4 h-4 text-blue-400 shrink-0" />;
  }
  if (normValue === "javascript") {
    return <Code2 className="w-4 h-4 text-yellow-500 shrink-0" />;
  }
  if (normValue === "typescript") {
    return <Code2 className="w-4 h-4 text-blue-500 shrink-0" />;
  }
  if (normValue === "react") {
    return <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />;
  }
  if (normValue === "python") {
    return <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  if (normValue === "php") {
    return <Database className="w-4 h-4 text-indigo-400 shrink-0" />;
  }
  if (normValue === "csharp" || normLabel.includes("c#")) {
    return <Cpu className="w-4 h-4 text-purple-400 shrink-0" />;
  }
  if (normValue === "markdown") {
    return <FileText className="w-4 h-4 text-amber-500 shrink-0" />;
  }
  
  return <FileCode className="w-4 h-4 text-slate-400 shrink-0" />;
}

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string, label: string) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  showAllOption?: boolean; // For filtering/searching
  allOptionLabel?: string; 
  activeLabel?: string; // Optional label override to handle Twig distinction
}

export default function LanguageSelector({
  value,
  onChange,
  disabled = false,
  size = "md",
  showAllOption = false,
  allOptionLabel = "Tous les langages",
  activeLabel
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Determine current display label and icon
  let displayLabel = "";
  let displayIcon = <FileCode className="w-4 h-4 text-slate-400 shrink-0" />;

  if (showAllOption && value === "all") {
    displayLabel = allOptionLabel;
    displayIcon = <Search className="w-4 h-4 text-indigo-400 shrink-0" />;
  } else {
    // If activeLabel is provided (e.g., to distinguish Twig from HTML), use it
    let matched = activeLabel 
      ? SUPPORTED_LANGUMENTS.find(l => l.value === value && l.label === activeLabel)
      : SUPPORTED_LANGUMENTS.find(l => l.value === value);

    // Fallback if not matched cleanly
    if (!matched) {
      matched = SUPPORTED_LANGUMENTS.find(l => l.value === value);
    }

    if (matched) {
      displayLabel = matched.label;
      displayIcon = getLanguageIcon(matched.label, matched.value);
    } else {
      displayLabel = value;
    }
  }

  const handleSelect = (val: string, label: string) => {
    if (disabled) return;
    onChange(val, label);
    setIsOpen(false);
  };

  const btnClasses = size === "sm"
    ? "h-7 px-2.5 py-1 text-[11px] gap-1.5"
    : "px-3 py-1.5 text-xs gap-2";

  return (
    <div className="relative inline-block w-full text-left" ref={dropdownRef} id="custom-language-selector">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-slate-900 border border-slate-700/80 hover:border-indigo-500/60 text-slate-200 font-semibold rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${btnClasses}`}
      >
        <span className="flex items-center gap-2 truncate">
          {displayIcon}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 py-1.5 max-h-72 overflow-y-auto scrollbar-thin animate-fadeIn">
          {showAllOption && (
            <button
              type="button"
              onClick={() => handleSelect("all", allOptionLabel)}
              className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                value === "all"
                  ? "bg-indigo-950/40 text-indigo-300 font-bold"
                  : "text-slate-400 hover:bg-slate-800/85 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{allOptionLabel}</span>
              </span>
              {value === "all" && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
            </button>
          )}

          {SUPPORTED_LANGUMENTS.map((lang, idx) => {
            // Check if active (matching both key/label if we are not in simple 'all' mode)
            const isMatch = showAllOption 
              ? value === lang.value 
              : value === lang.value && (activeLabel ? activeLabel === lang.label : true);

            return (
              <button
                key={lang.label + idx}
                type="button"
                onClick={() => handleSelect(lang.value, lang.label)}
                className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                  isMatch
                    ? "bg-indigo-950/45 text-white font-bold"
                    : "text-slate-350 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  {getLanguageIcon(lang.label, lang.value)}
                  <span className="truncate">{lang.label}</span>
                </span>
                {isMatch && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
