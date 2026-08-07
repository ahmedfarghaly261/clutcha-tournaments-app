/**
 * Compatibility re-export.
 *
 * The real Orval mutator now lives in `src/services/http/api-client.ts`
 * (see `services/http` in the architecture). This file only exists because
 * every file already generated under `src/api/generated/**` imports it via
 * the relative path `../../http/clutcha-axios` baked in at generation time.
 *
 * `orval.config.ts` has been updated to point new generations at
 * `services/http/api-client.ts` directly. Once `pnpm api:generate` has been
 * run against a reachable backend and all generated files import from the
 * new path, this shim (and this whole `api/http` folder) can be deleted.
 */
export * from '../../services/http/api-client'
