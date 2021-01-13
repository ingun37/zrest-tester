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
              images: await closet.viewer.capturePrincipleViews(),
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
function makeRecursiveTemplateJSCode(srests, waitTimeMS) {
    if (srests.length === 0) {
        return `fetch("${exports.hookDomain}", { method: "DELETE", });`;
    }
    else {
        return `
        console.log("loading srest, #", ${srests.length})
        closet.viewer.loadSeparatedZRest(${JSON.stringify(srests[0])}, (x)=>{}, 0, ()=>{
          new Promise(done => {
            setTimeout(done, ${waitTimeMS});
          }).then(()=>{
            return closet.viewer.capturePrincipleViews();
          }).then((images)=>{
            return fetch("${exports.hookDomain}", {
              method: "POST",
              body: JSON.stringify({
                images,
              }),
            });
          }).then(()=>{
            ${makeRecursiveTemplateJSCode(srests.slice(1), waitTimeMS)}
          })
        })`;
    }
}
function makeTemplateJSCode(srests, waitTimeMS) {
    const initCode = `closet.viewer.init({
  element: "target",
  width: 512,
  height: 512,
  stats: true,
});`;
    return initCode + makeRecursiveTemplateJSCode(srests, waitTimeMS);
}
const templateSrest = ({ libURL, srests, waitTimeMS }) => (react_1.default.createElement("div", null,
    react_1.default.createElement("div", { id: "target", style: { width: 512, height: 512 } }),
    react_1.default.createElement("script", { type: 'text/javascript', src: libURL.toString() }),
    react_1.default.createElement("script", { dangerouslySetInnerHTML: { __html: makeTemplateJSCode(srests, waitTimeMS) } })));
exports.templateSrest = templateSrest;
