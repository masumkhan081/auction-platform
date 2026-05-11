'use client';

import { useContext } from 'react';
import type { Socket } from 'socket.io-client';
import { SocketContext } from './socket-context';

export const useSocket = (): Socket | null => useContext(SocketContext);
