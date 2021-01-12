/// <reference types="react" />
/// <reference types="node" />
import * as U from "url";
import { SRest } from "./types";
export declare const hookDomain = "http://screenshotrequest.clo";
export declare const templateZrest: (libURL: U.URL, zrestURLs: U.URL[]) => JSX.Element;
export declare type SRestTemplateConfig = {
    libURL: U.URL;
    srests: readonly SRest[];
    waitTimeMS: number;
};
export declare const templateSrest: ({ libURL, srests, waitTimeMS }: SRestTemplateConfig) => JSX.Element;
