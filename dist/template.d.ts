/// <reference types="react" />
import * as U from "url";
import { SRest } from "./types";
export declare const hookDomain = "http://screenshotrequest.clo";
export declare const templateZrest: (libURL: U.URL, zrestURLs: U.URL[]) => JSX.Element;
export declare const templateSrest: (libURL: U.URL, srests: readonly SRest[]) => JSX.Element;
