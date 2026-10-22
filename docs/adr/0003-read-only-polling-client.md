# Viewer is a read-only, polling client of the tt-admin public API

The Viewer is a static site (GitHub Pages) that only reads game state from tt-admin's public JSON:API (`/api/*`, base URL set per environment) and never sends data anywhere. Game logic, scoring and Board Event recording all live in other repositories. Because the API has no realtime channel and no cache validators, the Viewer polls: frequently changing data (Territory Defense and Holding Team, Team Points) every 30s while the tab is visible and every 60s while hidden; slow-changing data (Regions, Activities, Tasks, Players) once per visit.

Rejected: websockets/SSE (would need broadcasting added to tt-admin for a presentation tool), a caching proxy or backend of our own (more infrastructure than a handful of Viewers polling a small, unpaginated dataset justifies), and pausing polling on hidden tabs (Viewers leave the map open as a second-screen scoreboard and expect it current when they look back).
