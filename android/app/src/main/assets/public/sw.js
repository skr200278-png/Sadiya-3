/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "website.html",
    "revision": "f77b07e95a6c7863647e2ff68a5ff569"
  }, {
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "privacy-policy.html",
    "revision": "4dfc1ec19086f698152721e14c008433"
  }, {
    "url": "index.html",
    "revision": "8ccaee46db90ef8a57154767e16d8991"
  }, {
    "url": "website/index.html",
    "revision": "f77b07e95a6c7863647e2ff68a5ff569"
  }, {
    "url": "privacy-policy/index.html",
    "revision": "4dfc1ec19086f698152721e14c008433"
  }, {
    "url": "assets/web-bFWPR9VM.js",
    "revision": null
  }, {
    "url": "assets/web-Cy8kj_2t.js",
    "revision": null
  }, {
    "url": "assets/web-Cr5j0eph.js",
    "revision": null
  }, {
    "url": "assets/purify.es-CLGrRn1w.js",
    "revision": null
  }, {
    "url": "assets/index.es-gR37nrTl.js",
    "revision": null
  }, {
    "url": "assets/index-CTCYKkAC.css",
    "revision": null
  }, {
    "url": "assets/index-CKmwezaX.js",
    "revision": null
  }, {
    "url": "assets/html2canvas.esm-QH1iLAAe.js",
    "revision": null
  }, {
    "url": "farm_app_icon_1779214389225.png",
    "revision": "f4b0b92fd90515155f169754cb06e314"
  }, {
    "url": "screenshot-desktop.png",
    "revision": "6bc686e2f8f71bb2fc3ed420b6014187"
  }, {
    "url": "screenshot-mobile.png",
    "revision": "64147684227571c26601dbd9004e77b2"
  }, {
    "url": "manifest.json",
    "revision": "0f3f6e5b2ce8028450a9d5f9c5b73322"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
