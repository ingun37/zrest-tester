import puppeteer, {Browser} from "puppeteer";

import {createNewPage, createTmpHTMLURL_JSX, streamPageEvents} from "page-request-emitter";
import * as E from "fp-ts/Either";
import {Either, isLeft} from "fp-ts/Either";
import * as A from "fp-ts/Array";
import * as D from "io-ts/Decoder";

import {concatMap, map, reduce, toArray} from "rxjs/operators";
import {pipe} from "fp-ts/function";
import {from, Observable, zip} from "rxjs";
import fetch from "node-fetch";

import {D_SRest, SRest} from "./types";
import * as TE from "fp-ts/TaskEither";
import {bracket, TaskEither, tryCatchK} from "fp-ts/TaskEither";
import * as RTE from "fp-ts/ReaderTaskEither";
import {ReaderTaskEither} from "fp-ts/ReaderTaskEither";

import {observableEither} from 'fp-ts-rxjs'
import {URL} from "url";
import fs from "fs";
import {resolve} from "path";
import {hookDomain, templateSrest, templateZrest} from "./template";
import {spawnSync} from "child_process";
import {fromTaskEither, ObservableEither, toTaskEither} from "fp-ts-rxjs/lib/ObservableEither";
import * as Tup from "fp-ts/Tuple";
import {ReaderObservableEither} from "fp-ts-rxjs/lib/ReaderObservableEither";
import {either, reader, taskEither} from "fp-ts";
import {none} from "fp-ts/Option";


const base64ToBuffer = (encoding: string) => Buffer.from(encoding, 'base64');
const cutDataURLHead = (dataURL: string) => {
    const header = "data:image/png;base64,";
    return dataURL.substring(header.length);
}

const principleViewResponse = D.type({
    images: D.array(D.string),
});

function stopWhenError<_E, _A>(oe: ObservableEither<_E, _A>): ObservableEither<_E, _A> {
    return new Observable<Either<_E, _A>>(subscriber => {
        oe.subscribe({
            next(either) {
                if (!subscriber.closed) {
                    subscriber.next(either);
                    if (isLeft(either)) {
                        subscriber.complete();
                    }
                }
            },
            complete() {
                subscriber.complete();
            },
            error(err) {
                subscriber.error(err);
            }
        })
    })
}

export function streamScreenshots_browser(jsx: JSX.Element, hookDomain: string): ReaderObservableEither<Browser, unknown, Buffer> {
    const pageurl = createTmpHTMLURL_JSX(jsx);
    return pipe(
        createNewPage(),
        reader.map(fromTaskEither),
        reader.map(ob => {
            return pipe(
                ob,
                observableEither.chain(page => {
                    const events = streamPageEvents(page, pageurl)({
                        filter: r => r.url().startsWith(hookDomain),
                        alterResponse: () => none,
                        debugResponse: () => {
                        }
                    });
                    return stopWhenError(events);
                }),
                observableEither.mapLeft(x => x as unknown),
                observableEither.chain((xxx) => {
                    switch (xxx._tag) {
                        case "RequestIntercept":
                            const principleViewBuffers = pipe(
                                xxx.request.postData(),
                                D.string.decode,
                                E.map(JSON.parse),
                                E.chain(principleViewResponse.decode),
                                E.map(x => x.images.map(cutDataURLHead).map(base64ToBuffer)),
                                E.mapLeft(x => x as unknown),
                                E.sequence(A.array),
                            );
                            return from(principleViewBuffers)
                        case "Log":
                            console.log("Log from page", xxx.message);
                            return from([])
                    }
                }),
            )
        })
    )
}

const streamSrestScreenshots_browser = pipe(
    templateSrest,
    reader.map(jsx => streamScreenshots_browser(jsx, hookDomain))
);

function mkNewDir(path: string) {
    if (fs.existsSync(path)) {
        fs.rmdirSync(path, {recursive: true});
    }
    fs.mkdirSync(path);
}

function writeBuffersInLexicographicOrder<_E>(destination: string, buffers: ObservableEither<_E, Buffer>) {
    const writeTask = buffers.pipe(
        reduce((acc, value, index) => {
            // return acc;
            const filepath = resolve(destination, lexicographic(index) + ".png");
            return pipe(acc, E.chainW(_ => value), E.map(buffer => fs.writeFileSync(filepath, buffer)))
        }, E.right<_E, void>(mkNewDir(destination))),
    )
    return toTaskEither(writeTask);
}

const fetchSrest = (url: string): TaskEither<unknown, SRest> => () => fetch(url).then(x => x.text()).then(JSON.parse).then(D_SRest.decode);

function fetchSrests(urls: string[]) {
    const srestOb = from(urls).pipe(
        map(fetchSrest),
        concatMap(fromTaskEither),
        toArray(),
        map(either.sequenceArray),
    )
    return toTaskEither(srestOb)
}

export function generateAndSaveSrestAnswers(sresturls: string[], destination: string, libURL: URL, waitTimeMS: number) {
    return runWithBrowser(browser => {
        return pipe(
            fetchSrests(sresturls),
            TE.chain(srests => {
                const answerBufferOE = streamSrestScreenshots_browser({srests, libURL, waitTimeMS})(browser);
                return writeBuffersInLexicographicOrder(destination, answerBufferOE);
            })
        )
    });
}

export function generateAndSaveZrestAnswers(libURL: URL, zrestURLs: URL[], destination: string) {
    return runWithBrowser(browser => {
        const zrestResults = streamScreenshots_browser(templateZrest(libURL, zrestURLs), hookDomain)(browser);
        return writeBuffersInLexicographicOrder(destination, zrestResults);
    })
}

export function runWithBrowser<_E, _T>(browserReadingTask: ReaderTaskEither<Browser, _E, _T>) {
    return bracket(
        tryCatchK(puppeteer.launch.bind(puppeteer), console.error)({args: ["--no-sandbox", "--disable-web-security"]}),
        RTE.mapLeft(console.error)(browserReadingTask),
        (browser) => {
            console.log("Releasing browser ...");
            return tryCatchK(() => browser.close(), console.error)()
        }
    )
}

function answerStream(answersDir: string) {
    const answerPaths = fs.readdirSync(answersDir).filter(x => x.endsWith(".png")).map(x => resolve(answersDir, x));
    return from(answerPaths).pipe(map(x => fs.readFileSync(x)));
}

function decodePossibleBuffer(x: unknown): string {
    return pipe(
        x,
        D.string.decode,
        either.getOrElse(_ => {
            if (x instanceof Buffer) {
                return x.toString('utf8');
            } else {
                return "Failed to decode: neither string or Buffer";
            }
        })
    )
}

export function saveDebugImages(x: Buffer, y: Buffer, index: number, destination: string) {
    const lexi = lexicographic(index);
    const xpath = resolve(destination, lexi + "-x.png");
    const ypath = resolve(destination, lexi + "-y.png");
    fs.writeFileSync(xpath, x);
    fs.writeFileSync(ypath, y);
    const spawned = spawnSync("closet-viewer-cv", [
        "-x", xpath,
        "-y", ypath,
        "--diff", resolve(destination, lexi + "-diff.png"),
        "--highlight", resolve(destination, lexi + "-highlight.png"),
        "--combined", resolve(destination, lexi + "-combined.png")
    ])

    console.log({stdout: decodePossibleBuffer(spawned.stdout), stderr: decodePossibleBuffer(spawned.stderr)});
    if (spawned.signal) {
        return E.left("closet-viewer-cv killed due to signal:" + spawned.signal)
    } else if (spawned.status) {
        return E.left(`closet-viewer-cv exited with error: ${spawned.status}`)
    } else {
        return E.right(1);
    }
}

function isDifferent([a, b]: [Buffer, Buffer]): boolean {
    return a.compare(b) !== 0;
}

export function lexicographic(idx: number): string {
    return "00000000".substr(0, 8 - idx.toString().length) + idx.toString();
}

function reduceTestResult<_E>(resultDebugImagesDir: string, pairs: ObservableEither<_E, [Buffer, Buffer]>) {
    mkNewDir(resultDebugImagesDir)
    return pairs.pipe(
        reduce((acc, value, index) => {
            return pipe(
                acc,
                E.chain(failCount => {
                    return pipe(value, E.chainW(pair => {
                        if (isDifferent(pair)) {
                            const saveSuccess = saveDebugImages(pair[0], pair[1], index, resultDebugImagesDir);
                            return E.map(_ => failCount + 1)(saveSuccess);
                        } else {
                            return E.right(failCount);
                        }
                    }))
                })
            )
        }, E.right<_E | string, number>(0))
    )
}

function compareResultsAndAnswers<_E>(resultEs: ObservableEither<_E, Buffer>, answersDir: string, debugImageDir: string) {
    const answers = answerStream(answersDir);
    const testResult = zip(resultEs, answers).pipe(
        map(Tup.sequence(E.either)),
        pairsOb => reduceTestResult(debugImageDir, pairsOb),
    )
    return toTaskEither(testResult);
}

export function testSrestLibrary(libURL: URL, sresturls: string[], answersDir: string, debugImageDir: string, waitTimeMS: number) {
    return runWithBrowser(browser => {
        return pipe(
            fetchSrests(sresturls),
            taskEither.chain(srests => {
                return compareResultsAndAnswers(
                    streamSrestScreenshots_browser({srests, libURL, waitTimeMS})(browser),
                    answersDir,
                    debugImageDir
                );
            }),
        )
    })
}

export function testZrestLibrary(libURL: URL, zrestURLs: URL[], answersDir: string, debugImageDir: string) {
    return runWithBrowser(browser => {
        return compareResultsAndAnswers(
            streamScreenshots_browser(templateZrest(libURL, zrestURLs), hookDomain)(browser),
            answersDir,
            debugImageDir
        )
    });
}