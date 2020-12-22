"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateSrest = exports.templateZrest = exports.hookDomain = void 0;
const react_1 = __importDefault(require("react"));
const literalize = (urls) => urls.map(x => x.toString()).map(x => `"${x}"`).join(", ");
exports.hookDomain = "http://screenshotrequest.clo";
const templateZrest = (libURL, zrestURLs) => (react_1.default.createElement("div", null,
    react_1.default.createElement("div", { id: "target", style: { width: 512, height: 512 } }),
    react_1.default.createElement("script", { type: 'text/javascript', src: libURL.toString() }),
    react_1.default.createElement("script", { dangerouslySetInnerHTML: {
            __html: `
closet.viewer.init({
  element: "target",
  width: 512,
  height: 512,
  stats: true,
});

function recurse(zrestURLs) {
  if (zrestURLs.length === 0) {
    fetch("http://screenshotrequest.clo", {
      method: "DELETE",
    });
  } else {
    console.log("loading zrest url", zrestURLs[0])
    closet.viewer.loadZrestUrl(
      zrestURLs[0],
      function (x) {},
      function (x) {
        (async function () {
          await fetch("${exports.hookDomain}", {
            method: "POST",
            body: JSON.stringify({
              images: closet.viewer.capturePrincipleViews(),
            }),
          });
          recurse(zrestURLs.slice(1))
        })();
      }
    );
  }
}
recurse([${literalize(zrestURLs)}])
    `
        } })));
exports.templateZrest = templateZrest;
function makeRecursiveTemplateJSCode(srests) {
    if (srests.length === 0) {
        return `fetch("${exports.hookDomain}", { method: "DELETE", });`;
    }
    else {
        return `closet.viewer.loadSeparatedZRest(${JSON.stringify(srests[0])}, (x)=>{}).then(()=>{
          return new Promise(done => {
            setTimeout(done, 8000);
          })
        }).then(()=>{
          return fetch("${exports.hookDomain}", {
            method: "POST",
            body: JSON.stringify({
              images: closet.viewer.capturePrincipleViews(),
            }),
          });
        }).then(()=>{
          ${makeRecursiveTemplateJSCode(srests.slice(1))}
        })`;
    }
}
function makeTemplateJSCode(libURL, srests) {
    const initCode = `closet.viewer.init({
  element: "target",
  width: 512,
  height: 512,
  stats: true,
});`;
    return initCode + makeRecursiveTemplateJSCode(srests);
}
const templateSrest = (libURL, srests) => (react_1.default.createElement("div", null,
    react_1.default.createElement("div", { id: "target", style: { width: 512, height: 512 } }),
    react_1.default.createElement("script", { type: 'text/javascript', src: libURL.toString() }),
    react_1.default.createElement("script", { dangerouslySetInnerHTML: { __html: makeTemplateJSCode(libURL, srests) } })));
exports.templateSrest = templateSrest;