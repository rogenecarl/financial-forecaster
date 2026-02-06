# Phase 1: Optimize QueryClient Defaults

## File to Modify
- `src/context/QueryProvider.tsx`

## Current State
The `QueryClient` is instantiated with zero default options. Every individual hook must specify its own `staleTime`, and there is no default error handling or garbage collection tuning.

## Changes

Add `defaultOptions` to `QueryClient`:

```tsx
const [queryClient] = useState(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,          // 30 seconds (matches most existing hooks)
          gcTime: 5 * 60 * 1000,         // 5 minutes garbage collection
          refetchOnWindowFocus: false,    // data changes are user-initiated
          retry: 1,                       // single retry for transient errors
        },
      },
    })
);
```

## Rationale

| Setting | Value | Why |
|---------|-------|-----|
| `staleTime` | 30s | Most existing hooks already use 30s. This sets a consistent baseline. |
| `gcTime` | 5min | Keeps unused cache entries in memory for fast back-navigation. |
| `refetchOnWindowFocus` | false | Financial app — data changes are user-initiated, not background. |
| `retry` | 1 | Single retry for network glitches. Server actions fail fast on auth. |

## Impact
- Hooks that already set `staleTime: 30_000` can optionally drop their override (same value)
- Hooks with different stale times (e.g., `60_000` for analytics) keep their local override
- Purely additive — no existing behavior changes
