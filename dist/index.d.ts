/// <reference types="react" />
/// <reference types="node" />
import { Browser } from "puppeteer";
import * as E from "fp-ts/Either";
import { SRest } from "./types";
import * as TE from "fp-ts/TaskEither";
import { ReaderTaskEither } from "fp-ts/ReaderTaskEither";
import { URL } from "url";
import { ReaderObservableEither } from "fp-ts-rxjs/lib/ReaderObservableEither";
export declare function streamScreenshots_browser(jsx: JSX.Element, hookDomain: string): ReaderObservableEither<Browser, void, Buffer>;
export declare function generateAndSaveSrestAnswers(styleIds: string[], token: string, destination: string, liburl: URL, domain: string): TE.TaskEither<void, void>;
export declare function generateAndSaveZrestAnswers(libURL: URL, zrestURLs: URL[], destination: string): TE.TaskEither<void, void>;
export declare function fetchSrests_token(domain: string, styleIds: readonly string[]): ReaderTaskEither<string, any, SRest[]>;
export declare function runWithBrowser<_E, _T>(browserReadingTask: ReaderTaskEither<Browser, _E, _T>): TE.TaskEither<void, _T>;
export declare function saveDebugImages(x: Buffer, y: Buffer, index: number, destination: string): E.Left<string> | E.Right<number>;
export declare function lexicographic(idx: number): string;
export declare function testSrestLibrary(liburl: URL, domain: string, styleIds: string[], answersDir: string, debugImageDir: string, token: string): TE.TaskEither<void, number>;
export declare function testZrestLibrary(libURL: URL, zrestURLs: URL[], answersDir: string, debugImageDir: string): TE.TaskEither<void, number>;
