import React, { useState } from "react";
import {
  auth,
  db
} from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import {
  X,
  Mail,
  Lock,
  User,
  Shield,
  Loader2,
  AlertCircle
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const saveUserProfile = async (user: any) => {
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split("@")[0],
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Error saving user profile to Firestore:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveUserProfile(result.user);
      onClose();
    } catch (err: any) {
      console.error("Google auth error:", err);
      // Friendly message
      if (err.code === "auth/popup-closed-by-user") {
        setError("La fenêtre d'authentification Google a été fermée.");
      } else {
        setError("Impossible de s'authentifier avec Google : " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveUserProfile(result.user);
      onClose();
    } catch (err: any) {
      console.error("GitHub auth error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("La fenêtre d'authentification GitHub a été fermée.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError("Un compte existe déjà avec le même e-mail mais des identifiants différents. Veuillez vous connecter avec le fournisseur d'origine.");
      } else {
        setError("Impossible de s'authentifier avec GitHub : " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new OAuthProvider("linkedin.com");
      const result = await signInWithPopup(auth, provider);
      await saveUserProfile(result.user);
      onClose();
    } catch (err: any) {
      console.error("LinkedIn auth error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("La fenêtre d'authentification LinkedIn a été fermée.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError("Un compte existe déjà avec le même e-mail mais des identifiants différents.");
      } else {
        setError("Impossible de s'authentifier avec LinkedIn : " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!isLogin && !displayName) {
      setError("Veuillez saisir votre nom complet d'affichage.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Sign In
        const result = await signInWithEmailAndPassword(auth, email, password);
        await saveUserProfile(result.user);
      } else {
        // Sign Up
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, {
          displayName: displayName
        });
        await saveUserProfile({
          ...result.user,
          displayName: displayName
        });
      }
      onClose();
    } catch (err: any) {
      console.error("Auth submit error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Cet e-mail est déjà associé à un compte.");
      } else if (err.code === "auth/weak-password") {
        setError("Le mot de passe doit comporter au moins 6 caractères.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Identifiants incorrects. Veuillez réessayer.");
      } else {
        setError(err.message || "Une erreur est survenue lors de l'authentification.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100"
        id="auth-modal-container"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-6 mt-2">
          <div className="p-3 bg-indigo-550/20 border border-indigo-505/30 rounded-xl mb-3 text-indigo-400">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold font-sans tracking-tight">
            {isLogin ? "Connexion SeeMyCode" : "Créer un compte"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 text-center">
            {isLogin 
              ? "Connectez-vous pour enregistrer vos snippets et collaborer en direct." 
              : "Rejoignez la communauté et commencez à co-coder en temps réel !"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl mb-4 text-red-400 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase font-mono tracking-wider">
                Nom complet d'affichage
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ex: Jean Dupont"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-955 border border-slate-800 rounded-xl placeholder-slate-500 text-slate-100 focus:outline-none focus:border-indigo-500 hover:border-slate-700 transition-all font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase font-mono tracking-wider">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="nom@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-955 border border-slate-800 rounded-xl placeholder-slate-500 text-slate-100 focus:outline-none focus:border-indigo-500 hover:border-slate-700 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase font-mono tracking-wider">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-955 border border-slate-800 rounded-xl placeholder-slate-500 text-slate-100 focus:outline-none focus:border-indigo-500 hover:border-slate-700 transition-all font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Chargement...</span>
              </>
            ) : (
              <span>{isLogin ? "Se connecter" : "S'inscrire"}</span>
            )}
          </button>
        </form>

        {/* Google Authentication Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800/80"></div>
          </div>
          <span className="relative px-3 bg-slate-900 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest">
            Ou continuer avec
          </span>
        </div>

        {/* Third-Party Auth Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex items-center sm:flex-col justify-center gap-2.5 sm:gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-755 border border-slate-700 hover:text-white font-bold text-sm rounded-xl cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            id="google-login-btn"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.05,3.1l3.2,2.48c1.87,-1.72 2.94,-4.25 2.94,-7.23C21.47,11.83 21.43,11.45 21.35,11.1z" fill="#4285F4" />
              <path d="M12,20.62c2.43,0 4.47,-0.8 5.96,-2.19l-3.2,-2.48c-0.89,0.6 -2.03,0.96 -3.2,0.96 -2.46,0 -4.54,-1.66 -5.28,-3.9l-3.3,2.56C4.46,18.57 7.91,20.62 12,20.62z" fill="#34A853" />
              <path d="M6.72,13.01C6.54,12.47 6.44,11.9 6.44,11.31c0,-0.59 0.1,-1.16 0.28,-1.7L3.42,7.05C2.71,8.47 2.31,10.07 2.31,11.75c0,1.68 0.4,3.28 1.11,4.7L6.72,13.01z" fill="#FBBC05" />
              <path d="M12,6.38c2.14,0 3.8,0.73 5.3,1.69l3.41,-3.41C18.66,2.72 15.54,1.88 12,1.88c-4.09,0 -7.54,2.05 -9.69,5.17l3.3,2.56C6.72,8.04 8.8,6.38 12,6.38z" fill="#EA4335" />
            </svg>
            <span className="text-xs">Google</span>
          </button>

          {/* GitHub */}
          <button
            type="button"
            onClick={handleGithubSignIn}
            disabled={loading}
            className="flex items-center sm:flex-col justify-center gap-2.5 sm:gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-755 border border-slate-700 hover:text-white font-bold text-sm rounded-xl cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            id="github-login-btn"
          >
            <svg className="w-4 h-4 text-white fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
            </svg>
            <span className="text-xs font-sans">GitHub</span>
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={handleLinkedInSignIn}
            disabled={loading}
            className="flex items-center sm:flex-col justify-center gap-2.5 sm:gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-755 border border-slate-700 hover:text-white font-bold text-sm rounded-xl cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            id="linkedin-login-btn"
          >
            <svg className="w-4 h-4 fill-current text-[#0a66c2] shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            <span className="text-xs font-sans">LinkedIn</span>
          </button>
        </div>

        {/* Toggle View Link */}
        <div className="text-center mt-5 text-xs text-slate-400">
          <span>{isLogin ? "Nouveau sur SeeMyCode ?" : "Déjà membre ?"} </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-indigo-400 hover:text-indigo-305 font-bold underline cursor-pointer hover:no-underline ml-1"
          >
            {isLogin ? "Créer un compte d'entraide" : "Se connecter maintenant"}
          </button>
        </div>
      </div>
    </div>
  );
}
