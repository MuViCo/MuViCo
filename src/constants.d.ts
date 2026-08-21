/**
 * Type declarations for ./constants.js.
 *
 * constants.js is DUAL-CONSUMED:
 *   - client (ESM `import`, via Vite / Babel)
 *   - server (CJS `require`, relying on Node >=20.19 require(esm) + syntax detection)
 *
 * It must stay a plain .js ESM file: renaming it to .ts would force a build step
 * on the server, and switching it to CJS would change how Vite resolves its named
 * exports. These declarations are the client's typed view of it.
 *
 * KEEP IN SYNC with ./constants.js by hand.
 */

/* password validation constants */
export declare const minPwLength: number
export declare const maxPwLength: number
export declare const invalidPwCharRegex: RegExp

/* username validation constants */
export declare const minUsernameLength: number
export declare const maxUsernameLength: number
export declare const usernameAllowedCharsRegex: RegExp
export declare const usernameStartEndRegex: RegExp
export declare const usernameConsecutiveSpecialsRegex: RegExp

/* bcrypt salt rounds */
export declare const saltRounds: number
