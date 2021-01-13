import React from "react";
import * as U from "url";
import {SRest} from "./types";

const literalize = (urls: U.URL[]): string => urls.map(x => x.toString()).map(x => `"${x}"`).join(", ")
export const hookDomain = "http://screenshotrequest.clo";
export const templateZrest = (libURL: U.URL, zrestURLs: U.URL[]) => (
    <div>
        <div id="target" style={{width: 512, height: 512}}/>
        <script type='text/javascript' src={libURL.toString()}/>
        <script dangerouslySetInnerHTML={{
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
          await fetch("${hookDomain}", {
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
        }}>
        </script>
    </div>
);

function makeRecursiveTemplateJSCode(srests: readonly SRest[], waitTimeMS:number): string {
    if (srests.length === 0) {
        return `fetch("${hookDomain}", { method: "DELETE", });`
    } else {
        return `
        console.log("loading srest, #", ${srests.length})
        closet.viewer.loadSeparatedZRest(${JSON.stringify(srests[0])}, (x)=>{}, 0, ()=>{
          new Promise(done => {
            setTimeout(done, ${waitTimeMS});
          }).then(()=>{
            return closet.viewer.capturePrincipleViews();
          }).then((images)=>{
            return fetch("${hookDomain}", {
              method: "POST",
              body: JSON.stringify({
                images,
              }),
            });
          }).then(()=>{
            ${makeRecursiveTemplateJSCode(srests.slice(1), waitTimeMS)}
          })
        })`
    }
}

function makeTemplateJSCode(srests: readonly SRest[], waitTimeMS:number): string {
    const initCode = `closet.viewer.init({
  element: "target",
  width: 512,
  height: 512,
  stats: true,
});`;
    return initCode + makeRecursiveTemplateJSCode(srests, waitTimeMS);
}

export type SRestTemplateConfig = {
    libURL: U.URL;
    srests: readonly SRest[];
    waitTimeMS:number;
}
export const templateSrest = ({libURL, srests, waitTimeMS}:SRestTemplateConfig) => (
    <div>
        <div id="target" style={{width: 512, height: 512}}/>
        <script type='text/javascript' src={libURL.toString()}/>
        <script dangerouslySetInnerHTML={{__html: makeTemplateJSCode(srests, waitTimeMS)}}>
        </script>
    </div>
);
