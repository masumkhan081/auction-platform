'use client';

import { createContext, type Context } from 'react';
import type { Socket } from 'socket.io-client';

/**
 * Connected socket instance, or `null` while the connection is being set up
 * or after teardown. Consumed via `useSocket()`.
 *
 * Explicit `Context<Socket | null>` annotation avoids TS2742 (the inferred
 * Socket type transitively references a deeply-pnpm-hoisted module that
 * tsc can't name portably).
 */
export const SocketContext: Context<Socket | null> = createContext<Socket | null>(null);
