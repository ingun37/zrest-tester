import {
    fetchSrests_token,
    generateAndSaveSrestAnswers,
    generateAndSaveZrestAnswers,
    testSrestLibrary,
    testZrestLibrary
} from "../src";
import * as E from "fp-ts/Either";
import {resolve} from "path";
import * as fs from "fs";
import fse from "fs-extra";
import {TestDataProvision} from "./provision-type";
import {testDataProvision} from "./test-data-provision";
import {spawnSync} from "child_process";

const testData: TestDataProvision = testDataProvision;

test("toket", () => {
    const promise = fetchSrests_token(testData.domain, testData.styleIds)(testData.token)();
    return expect(promise.then(E.isRight)).resolves.toBeTruthy();
}, 1000 * 60)

const testAnswersDir = resolve(__dirname, "test-answers");
test("save", () => {
    const task = generateAndSaveSrestAnswers(testData.styleIds, testData.token, testAnswersDir, testData.liburl, testData.domain);
    return expect(task().then(E.isRight)).resolves.toBeTruthy();
}, 1000 * 60 * 10)

const testDebugDir = resolve(__dirname, "test-debug-images");

test("compare", () => {
    expect(fs.existsSync(testAnswersDir)).toBeTruthy();
    const task = testSrestLibrary(testData.liburl, testData.domain, testData.styleIds, testAnswersDir, testDebugDir, testData.token);
    return task().then(either => {
        expect(E.isRight(either)).toBeTruthy();
        if (E.isRight(either)) {
            expect(either.right).toBe(0);
        }
    })
}, 1000 * 60 * 10)

const impairDir = resolve(__dirname, "impairs");

test("impair", () => {
    const wrongDir = resolve(__dirname, "test-wrongs");
    const wrongDebugDir = resolve(__dirname, "wrong-debug-images");

    if (fs.existsSync(wrongDir)) {
        fs.rmdirSync(wrongDir, {recursive: true});
    }
    fse.copySync(testAnswersDir, wrongDir, {recursive: true});
    fs.readdirSync(impairDir).forEach(impairFilename => {
        fs.copyFileSync(resolve(impairDir, impairFilename), resolve(wrongDir, impairFilename));
    });
    const task = testSrestLibrary(testData.liburl, testData.domain, testData.styleIds, wrongDir, wrongDebugDir, testData.token);
    return task().then(either => {
        expect(E.isRight(either)).toBeTruthy();
        if (E.isRight(either)) {
            expect(either.right).toBe(5);
        }
    })
}, 1000 * 60 * 10)
test("command", () => {
    const aaa = spawnSync("env",);
    console.log((aaa.stdout as any).toString('utf8'));
    expect(true).toBeTruthy();
})

const zrestAnswersDir = resolve(__dirname, "zrest-answers");
test("zrest gen answer", () => {
    const task = generateAndSaveZrestAnswers(testData.liburl, testData.zrestURLs, zrestAnswersDir);
    return expect(task().then(E.isRight)).resolves.toBeTruthy();
}, 1000 * 60 * 10)

const zrestDebugDir = resolve(__dirname, "zrest-debug");
test("zrest-libtest", () => {
    expect(fs.existsSync(zrestAnswersDir)).toBeTruthy();
    const task = testZrestLibrary(testData.liburl, testData.zrestURLs, zrestAnswersDir, zrestDebugDir);
    return task().then(either => {
        if (E.isRight(either)) {
            expect(either.right).toBe(0);
        } else {
            expect(false).toBeTruthy();
        }
    })
}, 1000 * 60 * 10);

const zrestWrongDir = resolve(__dirname, "zrest-wrongs");
test("zrest-impair", () => {
    if (fs.existsSync(zrestWrongDir)) {
        fs.rmdirSync(zrestWrongDir, {recursive: true});
    }
    fse.copySync(zrestAnswersDir, zrestWrongDir, {recursive: true});
    fs.readdirSync(impairDir).forEach(impairFilename => {
        fs.copyFileSync(resolve(impairDir, impairFilename), resolve(zrestWrongDir, impairFilename));
    });
    const task = testZrestLibrary(testData.liburl, testData.zrestURLs, zrestWrongDir, zrestDebugDir);
    return task().then(either => {
        expect(E.isRight(either)).toBeTruthy();
        if (E.isRight(either)) {
            expect(either.right).toBe(6);
        }
    })
}, 1000 * 60 * 10);