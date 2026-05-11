import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * shadcn-style class composer. Used by every UI primitive.
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
