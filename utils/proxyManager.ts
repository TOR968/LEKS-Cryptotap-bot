import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { logWithColor } from "./logger";

function getProxyAgent(proxyString: string | null, user: string | number): HttpsProxyAgent<string> | SocksProxyAgent | null {
    if (!proxyString) return null;

    try {
        if (proxyString.startsWith("http")) {
            logWithColor(user, `Using HTTP(S) proxy: ${proxyString}`, "info");
            return new HttpsProxyAgent(proxyString);
        } else if (proxyString.startsWith("socks")) {
            logWithColor(user, `Using SOCKS proxy: ${proxyString}`, "info");
            return new SocksProxyAgent(proxyString);
        } else {
            logWithColor(user, `Using HTTP(S) proxy: http://${proxyString}`, "info");
            return new HttpsProxyAgent("http://" + proxyString);
        }
    } catch (error) {
        logWithColor(user, `Error creating proxy agent: ${(error as Error).message}`, "error");
    }

    return null;
}

export { getProxyAgent };
