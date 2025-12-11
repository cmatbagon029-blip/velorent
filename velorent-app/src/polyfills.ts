/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main
 *      file.
 *
 * The current setup is for so-called "evergreen" browsers; the last versions of browsers that
 * automatically update themselves. This includes recent versions of Safari, Chrome (including
 * Opera), Edge on the desktop, and iOS and Chrome on mobile.
 *
 * Learn more in https://angular.io/guide/browser-support
 */

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/**
 * CRITICAL: These polyfills MUST be defined before Zone.js loads
 * Android WebView (especially older versions) doesn't support these modern APIs
 */

// globalThis polyfill
(function() {
  try {
    if (typeof (globalThis as any) === 'undefined') {
      if (typeof window !== 'undefined') {
        (window as any).globalThis = window;
      } else if (typeof self !== 'undefined') {
        (self as any).globalThis = self;
      }
    }
  } catch (e) {
    // Silently fail if polyfill can't be applied
  }
})();

// queueMicrotask polyfill - MUST be before Zone.js
(function() {
  try {
    if (typeof queueMicrotask === 'undefined') {
      const globalObj: any = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
      globalObj.queueMicrotask = function(callback: () => void) {
        if (typeof Promise !== 'undefined' && Promise.resolve) {
          Promise.resolve().then(callback).catch(function(error: any) {
            setTimeout(function() { throw error; }, 0);
          });
        } else {
          // Fallback if Promise is not available (very old browsers)
          setTimeout(callback, 0);
        }
      };
    }
  } catch (e) {
    // Silently fail if polyfill can't be applied
  }
})();

/**
 * By default, zone.js will patch all possible macroTask and DomEvents
 * user can disable parts of macroTask/DomEvents patch by setting following flags
 * because those flags need to be set before `zone.js` being loaded, and webpack
 * will put import in the top of bundle, so user need to create a separate file
 * in this directory (for example: zone-flags.ts), and put the following flags
 * into that file, and then add the following code before importing zone.js.
 * import './zone-flags';
 *
 * The flags allowed in zone-flags.ts are listed here.
 *
 * The following flags will work for all browsers.
 *
 * (window as any).__Zone_disable_requestAnimationFrame = true; // disable patch requestAnimationFrame
 * (window as any).__Zone_disable_on_property = true; // disable patch onProperty such as onclick
 * (window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove']; // disable patch specified eventNames
 *
 *  in IE/Edge developer tools, the addEventListener will also be wrapped by zone.js
 *  with the following flag, it will bypass `zone.js` patch for IE/Edge
 *
 *  (window as any).__Zone_enable_cross_context_check = true;
 *
 */

import './zone-flags';

/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import 'zone.js';  // Included with Angular CLI.


/***************************************************************************************************
 * APPLICATION IMPORTS
 */
