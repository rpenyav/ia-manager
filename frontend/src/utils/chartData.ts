import type { AuditEvent, UsageEvent } from '../types';

type DayBucket = {
  key: string;
  label: string;
};

const pad = (value: number) => value.toString().padStart(2, '0');

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const buildDayBuckets = (days: number): DayBucket[] => {
  const today = new Date();
  const buckets: DayBucket[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    buckets.push({
      key: toDateKey(date),
      label: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    });
  }
  return buckets;
};

export function buildDailyUsage(events: UsageEvent[], days = 7) {
  const buckets = buildDayBuckets(days);
  const tokens = Array(days).fill(0);
  const cost = Array(days).fill(0);
  const indexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]));

  events.forEach((event) => {
    const eventDate = new Date(event.createdAt);
    const key = toDateKey(eventDate);
    const index = indexByKey.get(key);
    if (index === undefined) {
      return;
    }
    tokens[index] += event.tokensIn + event.tokensOut;
    cost[index] += Number(event.costUsd || 0);
  });

  return {
    labels: buckets.map((bucket) => bucket.label),
    tokens,
    cost
  };
}

export function buildTenantSeries(events: UsageEvent[], days = 7) {
  const buckets = buildDayBuckets(days);
  const indexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]));
  const series: Record<string, number[]> = {};

  events.forEach((event) => {
    const eventDate = new Date(event.createdAt);
    const key = toDateKey(eventDate);
    const index = indexByKey.get(key);
    if (index === undefined) {
      return;
    }
    if (!series[event.tenantId]) {
      series[event.tenantId] = Array(days).fill(0);
    }
    series[event.tenantId][index] += event.tokensIn + event.tokensOut;
  });

  return {
    labels: buckets.map((bucket) => bucket.label),
    series
  };
}

export function countAuditByAction(events: AuditEvent[], max = 6) {
  const counts = new Map<string, number>();
  events.forEach((event) => {
    counts.set(event.action, (counts.get(event.action) || 0) + 1);
  });
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, max);
  return {
    labels: sorted.map(([action]) => action),
    values: sorted.map(([, value]) => value)
  };
}

export function buildAuditStatusByDay(events: AuditEvent[], days = 7) {
  const buckets = buildDayBuckets(days);
  const indexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]));
  const statusSet = new Set(events.map((event) => event.status));
  const series = Array.from(statusSet.values()).map((status) => ({
    name: status,
    data: Array(days).fill(0)
  }));
  const seriesMap = new Map(series.map((entry) => [entry.name, entry]));

  events.forEach((event) => {
    const eventDate = new Date(event.createdAt);
    const key = toDateKey(eventDate);
    const index = indexByKey.get(key);
    if (index === undefined) {
      return;
    }
    const entry = seriesMap.get(event.status);
    if (!entry) {
      return;
    }
    entry.data[index] += 1;
  });

  return {
    labels: buckets.map((bucket) => bucket.label),
    series
  };
}
