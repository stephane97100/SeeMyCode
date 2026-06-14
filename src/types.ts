export interface CorrectionResult {
  success: boolean;
  originalExplanation: string;
  correctedCode: string;
  correctionsList: string[];
}

export interface DocSnippet {
  id: string;
  code: string;
  language: string;
  title?: string;
  createdAt: string;
  expiresAt: string;
  parentCodeId?: string;
  isLocalFallback?: boolean;
  tags?: string[];
  ownerId?: string;
  ownerName?: string;
  activeEditorUid?: string | null;
  activeEditorName?: string | null;
  activeEditorExpires?: number | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
}

export interface CoEditor {
  uid: string;
  displayName: string;
  photoURL?: string;
  color: string;
  lastActive: number;
}
