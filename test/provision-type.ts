import * as URL from "url";

export type TestDataProvision = {
    domain:string,
    liburl:URL.URL;
    styleIds:string[];
    token:string;
    zrestURLs: URL.URL[];
}