import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// SKILL.md 규격 Firestore 에러 핸들러
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 부팅 시 연결 테스트 (SKILL.md 필수 제약)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase 연결 상태: 오프라인 모드일 수 있습니다.');
    }
  }
}
testConnection();

// 백그라운드 익명 로그인 처리 (게임 시작·진행은 절대 막지 않음)
let authResolve: (user: User) => void;
export const authPromise = new Promise<User>((resolve) => {
  authResolve = resolve;
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    authResolve(user);
  } else {
    signInAnonymously(auth)
      .then((cred) => {
        authResolve(cred.user);
      })
      .catch((err) => {
        console.warn('익명 로그인 백그라운드 시도 중:', err);
      });
  }
});

// 점수 저장 시 로그인 완료 대기 헬퍼
export async function ensureSignedIn(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  try {
    const user = await Promise.race([
      authPromise,
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000)),
    ]);
    return user;
  } catch {
    // 만약 타임아웃 발생 시 다시 즉시 익명 로그인 시도
    try {
      const cred = await signInAnonymously(auth);
      return cred.user;
    } catch (e) {
      console.error('익명 로그인 실패:', e);
      return null;
    }
  }
}
