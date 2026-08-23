/**
 * Typed replacements for react-redux's useDispatch and useSelector.
 *
 * useAppDispatch is what lets components dispatch the hand-written thunks in
 * presentationReducer: the untyped Dispatch rejects a function argument.
 *
 * These are typed by annotation rather than with react-redux 9's `withTypes`
 * helper on purpose. withTypes is a function CALL evaluated when this module
 * loads, and nine test files mock react-redux with a factory that supplies only
 * the hooks they use -- so the call throws "useDispatch.withTypes is not a
 * function" and takes the whole suite down before a single test runs. Assigning
 * the hooks through a type annotation executes nothing at import time, so a
 * partial mock stays fine, and the typing is identical.
 */
import { useDispatch, useSelector } from "react-redux"

import type { TypedUseSelectorHook } from "react-redux"
import type { AppDispatch, RootState } from "./store"

// `import type` above is load-bearing, not stylistic. A value import of ./store
// would instantiate the real store inside those same test files, defeating
// their mocks and pulling services/presentation -- and therefore axios -- into
// their module graph. Type imports are erased by Babel.

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
