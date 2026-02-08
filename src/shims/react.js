// Shim: re-export React from the CDN-loaded window global
// This prevents Vite from bundling a second copy of React
const R = window.React;
export default R;
export const {
  useState, useEffect, useRef, useCallback, useMemo, useContext,
  useReducer, useLayoutEffect, useImperativeHandle, useDebugValue,
  createElement, createContext, createRef, forwardRef,
  Fragment, StrictMode, Suspense,
  memo, lazy, Children, Component, PureComponent,
  isValidElement, cloneElement, version
} = R;
