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
    "url": "registerSW.js",
    "revision": "402b66900e731ca748771b6fc5e7a068"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "030b37036eea3e70c79aa5ad81119d68"
  }, {
    "url": "pwa-512x512.png",
    "revision": "4f08469296a4ffed7bcaaab864ab134e"
  }, {
    "url": "pwa-192x192.png",
    "revision": "8e3b6b5cc4586e0efa47fe0c27e23a10"
  }, {
    "url": "index.html",
    "revision": "a49c5f44a5ecb9c6e36294fbb26e6852"
  }, {
    "url": "icon.svg",
    "revision": "3ed68f3ed678570cebc88f5235b224a1"
  }, {
    "url": "favicon.ico",
    "revision": "20cd9dd5dce878b3a17c02506122994b"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "2f176ab1ba84e0df98a84dfc7ca8044b"
  }, {
    "url": "assets/index-PwJA9Y96.js",
    "revision": null
  }, {
    "url": "assets/index-CnkybbQH.css",
    "revision": null
  }, {
    "url": "assets/aistudio/image_b75cb74a.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_70e451dd.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "2f176ab1ba84e0df98a84dfc7ca8044b"
  }, {
    "url": "favicon.ico",
    "revision": "20cd9dd5dce878b3a17c02506122994b"
  }, {
    "url": "icon.svg",
    "revision": "3ed68f3ed678570cebc88f5235b224a1"
  }, {
    "url": "pwa-192x192.png",
    "revision": "8e3b6b5cc4586e0efa47fe0c27e23a10"
  }, {
    "url": "pwa-512x512.png",
    "revision": "4f08469296a4ffed7bcaaab864ab134e"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "030b37036eea3e70c79aa5ad81119d68"
  }, {
    "url": "manifest.webmanifest",
    "revision": "2f3f374ab01b1e3189ca4167b997faaf"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
