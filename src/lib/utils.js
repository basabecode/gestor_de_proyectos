import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { nanoid } from 'nanoid';
import { format, formatDistanceToNow, isToday, isYesterday, isPast, isFuture, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix = '') {
  const id = nanoid(10);
  return prefix ? `${prefix}_${id}` : id;
}

export function formatDate(date, fmt = 'dd MMM yyyy') {
  if (!date) return '';
  return format(new Date(date), fmt, { locale: es });
}

export function formatRelativeDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

export function getDateSemaphore(dateStr) {
  if (!dateStr) return 'none';
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = differenceInDays(date, today);
  if (diff < 0) return 'overdue';
  if (diff <= 2) return 'warning';
  return 'ok';
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#579bfc', '#00c875', '#e2445c', '#a25ddc', '#ff642e',
    '#fdab3d', '#66ccff', '#037f4c', '#ff007f', '#00d2d2',
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const val = typeof key === 'function' ? key(item) : item[key];
    (groups[val] = groups[val] || []).push(item);
    return groups;
  }, {});
}

export function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export function truncate(str, max = 50) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max) + '...';
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function safeLocalStorage(key, fallback = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}
