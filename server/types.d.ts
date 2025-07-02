import 'express-session';
import { SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionStore {
    get: (sid: string, callback: (err: any, session?: any) => void) => void;
    set: (sid: string, session: any, callback?: (err?: any) => void) => void;
    destroy: (sid: string, callback?: (err?: any) => void) => void;
    all?: (callback: (err: any, obj?: { [sid: string]: SessionData; } | null | undefined) => void) => void;
    length?: (callback: (err: any, length?: number) => void) => void;
    clear?: (callback?: (err?: any) => void) => void;
    touch?: (sid: string, session: any, callback?: (err?: any) => void) => void;
  }
}