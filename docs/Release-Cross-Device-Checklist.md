# Release Cross-Device Checklist

Use this checklist before deploying changes to production.

## 1) Browser and Device Matrix

Test at minimum:
- Android: Chrome (latest), Samsung Internet (latest)
- iOS: Safari (latest), Chrome iOS (latest)
- Desktop: Chrome, Edge, Firefox, Safari (if available)

## 2) Map and Cluster Validation

- Open app at world view (zoom 2-4), verify no overlapping cluster labels.
- Pan slowly and quickly; clusters should update cleanly.
- Zoom in/out repeatedly around dense marker areas.
- Confirm cluster counts are stable (no temporary double labels like 6 + 5 + 11 at once).
- Verify single story markers appear only once and remain clickable.

## 3) Performance Validation

In desktop DevTools, simulate:
- Network: Fast 3G and Slow 4G
- CPU: 4x slowdown

Checks:
- Initial map render under constrained settings is still usable.
- Marker/cluster updates complete without visual artifacts.
- No browser freeze during pan/zoom.

## 4) Functional Flows

- Sign in and sign out.
- Add a new story at high zoom.
- Open story card from marker.
- Open Discover feed and close it.
- Use search and "Find my location".
- Verify random story jump works.

## 5) Console and Network Hygiene

- No uncaught runtime errors in Console.
- No failed static asset requests (especially map and cluster CSS/JS).
- API requests return expected status codes.

## 6) Accessibility and Touch UX

- Buttons are tappable on mobile (no accidental misses).
- Text remains readable at default mobile zoom.
- Panels/modals can be closed reliably on touch.

## 7) Release Gate

Ship only if:
- No blocker visual bugs on tested devices.
- No critical console errors.
- Core flows (view map, read story, write story, auth) pass.

## Notes for This Project

- `react-leaflet-cluster` needs manual CSS imports in entrypoint.
- `chunkedLoading` should be enabled only for large marker sets to reduce temporary rendering artifacts on slower devices.
