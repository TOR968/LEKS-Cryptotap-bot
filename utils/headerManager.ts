interface Headers {
    ":authority"?: string;
    ":method"?: string;
    ":path"?: string;
    ":scheme"?: string;
    "User-Agent": string;
    Accept: string;
    "Accept-Language": string;
    "Accept-Encoding": string;
    Authorization?: string;
    "Content-Type": string;
    Connection: string;
    "Cache-Control": string;
    Pragma: string;
    DNT: string;
    "sec-ch-ua"?: string;
    "sec-ch-ua-mobile": string;
    "sec-ch-ua-platform"?: string;
    "sec-fetch-dest"?: string;
    "sec-fetch-mode"?: string;
    "sec-fetch-site"?: string;
    Origin: string;
    Referer: string;
    TE?: string;
    priority?: string;
}

interface BrowserData {
    name?: string;
    version?: string;
}

interface HeaderOptions {
    authToken?: string;
    path?: string;
}

const generateHeaders = (userAgent: string, options: HeaderOptions = {}): Headers => {
    let headers: Headers = {
        "User-Agent": userAgent,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "uk,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": "application/json",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        DNT: "1",
        "sec-ch-ua":
            '"Microsoft Edge";v="136", "Microsoft Edge WebView2";v="136", "Not.A/Brand";v="99", "Chromium";v="136"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        Origin: "https://view.leks.space",
        Referer: "https://view.leks.space/",
        priority: "u=1, i",
    };

    if (options.path) {
        headers[":authority"] = "leks.space";
        headers[":method"] = "GET";
        headers[":path"] = options.path;
        headers[":scheme"] = "https";
    }

    if (options.authToken) {
        headers["Authorization"] = `Bearer ${options.authToken}`;
    }

    let browserData: BrowserData = {};

    if (userAgent.includes("Firefox/")) {
        const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
        if (firefoxMatch && firefoxMatch[1]) {
            browserData.name = "Firefox";
            browserData.version = firefoxMatch[1];
            delete headers["sec-ch-ua"];
            delete headers["sec-ch-ua-platform"];
            headers["Accept"] = "application/json, text/plain, */*";
            headers["TE"] = "trailers";
        }
    } else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/") && !userAgent.includes("Edg/")) {
        const safariMatch = userAgent.match(/Version\/(\d+\.\d+)/);
        if (safariMatch && safariMatch[1]) {
            browserData.name = "Safari";
            browserData.version = safariMatch[1];
            headers["sec-ch-ua"] = `"Safari";v="${safariMatch[1]}", "Apple WebKit";v="605.1.15"`;
            headers["Accept"] = "application/json,text/plain,*/*";
        }
    } else if (userAgent.includes("Edg/")) {
        const edgeMatch = userAgent.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
        if (edgeMatch && edgeMatch[1]) {
            browserData.name = "Edge";
            browserData.version = edgeMatch[1];
            headers["sec-ch-ua"] = `"Microsoft Edge";v="${edgeMatch[1].split(".")[0]}", "Microsoft Edge WebView2";v="${
                edgeMatch[1].split(".")[0]
            }", "Not.A/Brand";v="99", "Chromium";v="${edgeMatch[1].split(".")[0]}"`;
        }
    } else if (userAgent.includes("OPR/") || userAgent.includes("Opera/")) {
        const operaMatch = userAgent.match(/OPR\/(\d+\.\d+\.\d+\.\d+)/) || userAgent.match(/Opera\/(\d+\.\d+)/);
        if (operaMatch && operaMatch[1]) {
            browserData.name = "Opera";
            browserData.version = operaMatch[1];
            headers["sec-ch-ua"] = `"Opera";v="${operaMatch[1].split(".")[0]}", "Chromium";v="${
                operaMatch[1].split(".")[0]
            }", "Not.A/Brand";v="99"`;
        }
    } else if (userAgent.includes("Chrome/")) {
        const chromeVersionMatch = userAgent.match(/Chrome\/(\d+)/);
        if (chromeVersionMatch && chromeVersionMatch[1]) {
            browserData.name = "Chrome";
            browserData.version = chromeVersionMatch[1];
            headers[
                "sec-ch-ua"
            ] = `"Chromium";v="${chromeVersionMatch[1]}", "Not.A/Brand";v="99", "Google Chrome";v="${chromeVersionMatch[1]}"`;
        }
    } else if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) {
        const ieMatch = userAgent.match(/MSIE (\d+\.\d+)/) || userAgent.match(/rv:(\d+\.\d+)/);
        if (ieMatch && ieMatch[1]) {
            browserData.name = "Internet Explorer";
            browserData.version = ieMatch[1];
            delete headers["sec-ch-ua"];
            delete headers["sec-ch-ua-platform"];
            delete headers["sec-fetch-dest"];
            delete headers["sec-fetch-mode"];
            delete headers["sec-fetch-site"];
            headers["Accept"] = "*/*";
        }
    }

    if (
        userAgent.toLowerCase().includes("mobile") ||
        userAgent.includes("iPhone") ||
        userAgent.includes("iPad") ||
        userAgent.includes("iPod") ||
        userAgent.includes("Android")
    ) {
        headers["sec-ch-ua-mobile"] = "?1";
    }

    if (userAgent.includes("Windows")) {
        headers["sec-ch-ua-platform"] = '"Windows"';
    } else if (userAgent.includes("Macintosh") || userAgent.includes("Mac OS X")) {
        headers["sec-ch-ua-platform"] = '"macOS"';
    } else if (userAgent.includes("Linux") && !userAgent.includes("Android")) {
        headers["sec-ch-ua-platform"] = '"Linux"';
    } else if (userAgent.includes("Android")) {
        headers["sec-ch-ua-platform"] = '"Android"';
    } else if (userAgent.includes("iPhone") || userAgent.includes("iPad") || userAgent.includes("iPod")) {
        headers["sec-ch-ua-platform"] = '"iOS"';
    }

    return headers;
};

export { generateHeaders, HeaderOptions };
