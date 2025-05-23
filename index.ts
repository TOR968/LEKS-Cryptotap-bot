import fs from "fs";
import path from "path";
import axios, { AxiosRequestConfig } from "axios";
import WebSocket from "ws";
import { logWithColor } from "./utils/logger";
import { getProxyAgent } from "./utils/proxyManager";
import getRandomNumber from "./utils/randomNumber";
import { scheduleNextRun } from "./utils/schedule";
import sleep from "./utils/sleep";
import { generateHeaders } from "./utils/headerManager";
import { HttpsProxyAgent } from "https-proxy-agent";
import UserAgentManager from "./utils/userAgentManager";

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf-8"));

const userAgentManager = new UserAgentManager();

if (!config.socketEndpoint) {
    config.socketEndpoint = "wss://socket.leks.space:8001";
}

interface UserData {
    hash: string;
    telegramId: string;
    firstName: string;
    username: string;
}

interface ApiResponse {
    status?: string;
    message?: string;
    token?: string;
    show_onboarding?: boolean;
    uuid?: string;
    energy?: number;
    [key: string]: any;
}

interface TapInfo {
    coin_balance: number;
    mined_coins: number;
    passive_mined_coins: number;
    energy: number;
    new_level: boolean;
}

interface DailyReward {
    id: number;
    day: number;
    reward: number;
    can_claim: boolean;
    current_reward: boolean;
}

function readDataFromFile(filePath: string): UserData[] {
    try {
        const data = fs.readFileSync(filePath, "utf-8");
        const lines = data.split("\n").filter((line) => line.trim() !== "");

        return lines.map((line) => {
            const userMatch = line.match(/user=%7B%22id%22%3A(\d+)/);
            const nameMatch = line.match(/first_name%22%3A%22([^%]+)/);
            const usernameMatch = line.match(/username%22%3A%22([^%]+)/);

            const telegramId = userMatch ? userMatch[1] : "unknown";
            const firstName = nameMatch ? nameMatch[1] : "unknown";
            const username = usernameMatch ? usernameMatch[1] : "unknown";

            return {
                hash: line,
                telegramId,
                firstName,
                username,
            };
        });
    } catch (error) {
        logWithColor("SYSTEM", `Error reading data file: ${(error as Error).message}`, "error");
        return [];
    }
}

function readProxiesFromFile(filePath: string): string[] {
    try {
        const data = fs.readFileSync(filePath, "utf-8");
        return data.split("\n").filter((line) => line.trim() !== "");
    } catch (error) {
        logWithColor("SYSTEM", `Error reading proxy file: ${(error as Error).message}`, "error");
        return [];
    }
}

async function registerUser(userData: UserData, proxy: string | null): Promise<boolean> {
    try {
        const userAgent =
            userAgentManager.getUserAgent(userData.hash) ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0";
        const headers = generateHeaders(userAgent);

        headers.Origin = "https://view.leks.space";
        headers.Referer = "https://view.leks.space/";

        const requestConfig: AxiosRequestConfig = {
            headers: headers as any,
            httpsAgent: getProxyAgent(proxy, userData.telegramId),
        };

        const requestBody = {
            hash: userData.hash,
            message: {
                chat: {
                    id: parseInt(userData.telegramId),
                },
                from: {
                    id: parseInt(userData.telegramId),
                    first_name: userData.firstName,
                    last_name: "",
                    username: userData.username,
                    language_code: "uk",
                    is_premium: true,
                },
            },
        };

        logWithColor(userData.username, "Registering user...", "registration");

        const response = await axios.post(`${config.baseURL}${config.registerEndpoint}`, requestBody, requestConfig);

        logWithColor(userData.username, `Registration successful: ${JSON.stringify(response.data)}`, "success");

        return true;
    } catch (error) {
        const errorMessage = (error as any).response?.data?.message || (error as Error).message;
        logWithColor(userData.username, `Registration error: ${errorMessage}`, "error");
        return false;
    }
}

async function loginUser(userData: UserData, proxy: string | null): Promise<string | null> {
    try {
        const userAgent =
            userAgentManager.getUserAgent(userData.hash) ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0";
        const headers = generateHeaders(userAgent);

        headers.Origin = "https://view.leks.space";
        headers.Referer = "https://view.leks.space/";

        const requestConfig: AxiosRequestConfig = {
            headers: headers as any,
            httpsAgent: getProxyAgent(proxy, userData.telegramId),
        };

        const requestBody = {
            hash: userData.hash,
        };

        logWithColor(userData.username, "Logging in user...", "info");

        const response = await axios.post(
            `${config.baseURL}${config.loginEndpoint}?telegram_id=${userData.telegramId}`,
            requestBody,
            requestConfig
        );

        if (response.data?.token) {
            logWithColor(userData.username, "Login successful, token received", "success");
            return response.data.token;
        } else {
            logWithColor(userData.username, "Login successful, but no token received", "warning");
            return null;
        }
    } catch (error) {
        const errorMessage = (error as any).response?.data?.message || (error as Error).message;
        logWithColor(userData.username, `Login error: ${errorMessage}`, "error");
        return null;
    }
}

async function claimDailyReward(
    userData: {
        telegramId: string;
        username: string;
        hash: string;
    },
    token: string,
    proxy: string | null
): Promise<boolean> {
    try {
        const userAgent =
            userAgentManager.getUserAgent(userData.hash) ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0";
        const headers = generateHeaders(userAgent);

        headers.Origin = "https://view.leks.space";
        headers.Referer = "https://view.leks.space/";
        headers.Authorization = `Bearer ${token}`;

        const requestConfig: AxiosRequestConfig = {
            headers: headers as any,
            httpsAgent: getProxyAgent(proxy, userData.telegramId),
        };

        logWithColor(userData.username, "Checking daily rewards...", "info");
        const rewardsResponse = await axios.get(`${config.baseURL}${config.dailyRewardEndpoint}`, requestConfig);

        const rewards: DailyReward[] = rewardsResponse.data;
        const claimableReward = rewards.find((reward) => reward.can_claim === true);

        if (claimableReward) {
            logWithColor(
                userData.username,
                `Found claimable daily reward: Day ${claimableReward.day}, Amount: ${claimableReward.reward}`,
                "info"
            );

            const claimResponse = await axios.post(
                `${config.baseURL}${config.dailyRewardClaimEndpoint}`,
                {},
                requestConfig
            );

            if (claimResponse.data?.message === "Reward claimed successfully") {
                logWithColor(
                    userData.username,
                    `Daily reward claimed successfully: ${claimableReward.reward} coins`,
                    "success"
                );
                return true;
            } else {
                logWithColor(userData.username, "Failed to claim daily reward", "warning");
                return false;
            }
        } else {
            logWithColor(userData.username, "No daily rewards available to claim", "info");
            return false;
        }
    } catch (error) {
        const errorMessage = (error as any).response?.data?.message || (error as Error).message;
        logWithColor(userData.username, `Error checking/claiming daily reward: ${errorMessage}`, "error");
        return false;
    }
}

async function getUserProfile(userData: UserData, token: string, proxy: string | null): Promise<ApiResponse | null> {
    try {
        const userAgent =
            userAgentManager.getUserAgent(userData.hash) ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0";
        const headers = generateHeaders(userAgent);

        headers.Origin = "https://view.leks.space";
        headers.Referer = "https://view.leks.space/";
        headers.Authorization = `Bearer ${token}`;

        const requestConfig: AxiosRequestConfig = {
            headers: headers as any,
            httpsAgent: getProxyAgent(proxy, userData.telegramId),
        };

        logWithColor(userData.username, "Getting user profile...", "info");

        const response = await axios.get(`${config.baseURL}${config.profileEndpoint}`, requestConfig);

        logWithColor(
            userData.telegramId,
            `Profile received: ID=${response.data.id}, Balance=${response.data.coin_balance}`,
            "success"
        );

        return response.data;
    } catch (error) {
        const errorMessage = (error as any).response?.data?.message || (error as Error).message;
        logWithColor(userData.username, `Error getting profile: ${errorMessage}`, "error");
        return null;
    }
}

async function connectToWebSocket(userData: UserData, uuid: string, proxy: string | null): Promise<WebSocket | null> {
    try {
        const wsUrl = `${config.socketEndpoint}/${uuid}`;
        logWithColor(userData.username, `Connecting to WebSocket: ${wsUrl}`, "info");

        const wsOptions: WebSocket.ClientOptions = {};

        if (proxy) {
            wsOptions.agent = new HttpsProxyAgent(proxy);
        }

        const ws = new WebSocket(wsUrl, wsOptions);

        return new Promise((resolve, reject) => {
            ws.on("open", () => {
                logWithColor(userData.username, `WebSocket connection established`, "success");
                resolve(ws);
            });

            ws.on("error", (error) => {
                logWithColor(userData.username, `WebSocket connection error: ${error.message}`, "error");
                reject(error);
            });

            setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN) {
                    reject(new Error("WebSocket connection timeout"));
                }
            }, 10000);
        });
    } catch (error) {
        logWithColor(userData.username, `Error connecting to WebSocket: ${(error as Error).message}`, "error");
        return null;
    }
}

async function performTaps(
    userData: UserData,
    ws: WebSocket,
    initialEnergy: number,
    coinsPerTap: number
): Promise<void> {
    try {
        let currentEnergy = initialEnergy;
        let tapCount = 0;
        let lastTapTime = Date.now();

        logWithColor(userData.username, `Starting tapping with initial energy: ${initialEnergy}`, "info");

        ws.on("message", (data) => {
            try {
                const message = data.toString();

                if (message.includes("tap_info")) {
                    const tapInfo: { tap_info: TapInfo } = JSON.parse(message);
                    currentEnergy = tapInfo.tap_info.energy;
                    lastTapTime = Date.now();

                    logWithColor(
                        userData.username,
                        `Tap result: Energy=${currentEnergy.toFixed(2)}, Mined=${tapInfo.tap_info.mined_coins}`,
                        "info"
                    );
                }
            } catch (error) {}
        });

        while (currentEnergy > currentEnergy % coinsPerTap) {
            ws.send("tap");
            tapCount++;

            const tapDelay = getRandomNumber(100, 300);
            await sleep(tapDelay);

            if (tapCount % 10 === 0) {
                const breakTime = getRandomNumber(500, 1000);
                await sleep(breakTime);
                logWithColor(userData.username, `Taking a short break after ${tapCount} taps`, "info");
            }

            if (Date.now() - lastTapTime > 10000) {
                logWithColor(
                    userData.telegramId,
                    `No energy updates received for 10 seconds, stopping taps`,
                    "warning"
                );
                break;
            }
        }

        logWithColor(userData.username, `Tapping completed. Total taps: ${tapCount}`, "success");
    } catch (error) {
        logWithColor(userData.username, `Error during tapping: ${(error as Error).message}`, "error");
    } finally {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
            logWithColor(userData.username, `WebSocket connection closed`, "info");
        }
    }
}

async function processUser(userData: UserData, proxy: string | null): Promise<void> {
    try {
        const registerSuccess = await registerUser(userData, proxy);
        if (!registerSuccess) {
            logWithColor(userData.username, "Skipping further steps due to registration error", "warning");
            return;
        }

        await sleep(getRandomNumber(1000, 3000));

        const token = await loginUser(userData, proxy);
        if (!token) {
            logWithColor(userData.username, "Skipping further steps due to login error", "warning");
            return;
        }

        await sleep(getRandomNumber(1000, 3000));

        await claimDailyReward(userData, token, proxy);

        await sleep(getRandomNumber(1000, 2000));

        const profile = await getUserProfile(userData, token, proxy);
        if (!profile) {
            logWithColor(userData.username, "Failed to get user profile", "warning");
            return;
        }

        if (profile.uuid && profile.energy) {
            await sleep(getRandomNumber(1000, 3000));

            const ws = await connectToWebSocket(userData, profile.uuid, proxy);
            if (ws) {
                await performTaps(userData, ws, profile.energy, profile.coins_per_tap);
            } else {
                logWithColor(userData.username, "Failed to establish WebSocket connection", "error");
            }
        } else {
            logWithColor(userData.username, "Profile missing UUID or energy information", "warning");
        }
    } catch (error) {
        logWithColor(userData.username, `Error processing user: ${(error as Error).message}`, "error");
    }
}

async function main(): Promise<void> {
    try {
        logWithColor("SYSTEM", "Starting script...", "info");

        const usersData = readDataFromFile(config.dataList);
        const proxies = config.useProxy ? readProxiesFromFile(config.proxyList) : [];

        logWithColor("SYSTEM", `Loaded ${usersData.length} users and ${proxies.length} proxies`, "info");

        for (let i = 0; i < usersData.length; i++) {
            const userData = usersData[i];
            let proxy: string | null = null;

            if (config.useProxy && proxies.length > 0) {
                if (i < proxies.length) {
                    proxy = proxies[i];
                } else {
                    logWithColor(userData.username, "Not enough proxies, using direct connection", "warning");
                }
            }

            await processUser(userData, proxy);

            if (i < usersData.length - 1) {
                const delay = getRandomNumber(3000, 8000);
                logWithColor("SYSTEM", `Delay ${delay}ms before processing next user`, "info");
                await sleep(delay);
            }
        }

        logWithColor("SYSTEM", "Script completed successfully", "success");

        scheduleNextRun(config.runIntervalHours, main);
    } catch (error) {
        logWithColor("SYSTEM", `Critical error: ${(error as Error).message}`, "error");

        scheduleNextRun(config.runIntervalHours, main);
    }
}

main().catch((error) => {
    logWithColor("SYSTEM", `Unexpected error: ${error.message}`, "error");
});
