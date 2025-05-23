import * as fs from "fs";
import * as querystring from "querystring";

class UserAgentManager {
    private tokensFile: string;
    private userAgentsFile: string;
    private userAgentsListFile: string;

    constructor(
        tokensFile: string = "data.txt",
        userAgentsFile: string = "user_agents.json",
        userAgentsListFile: string = "./utils/user_agents_list.txt"
    ) {
        this.tokensFile = tokensFile;
        this.userAgentsFile = userAgentsFile;
        this.userAgentsListFile = userAgentsListFile;
    }

    private readFileLines(filePath: string): string[] {
        try {
            return fs
                .readFileSync(filePath, "utf-8")
                .split("\n")
                .filter((line) => line.trim() !== "");
        } catch (error) {
            console.error(`File reading error ${filePath}: ${(error as Error).message}`);
            return [];
        }
    }

    private generateUserAgent(availableUserAgents: string[]): string {
        if (availableUserAgents.length === 0) {
            return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
        }

        const randomIndex = Math.floor(Math.random() * availableUserAgents.length);
        return availableUserAgents[randomIndex].trim();
    }

    private extractFirstName(initData: string): string | null {
        try {
            interface User {
                first_name?: string;
            }

            const parsedData = querystring.parse(initData);
            const userString = parsedData.user as string;

            if (!userString) return null;

            const user = JSON.parse(decodeURIComponent(userString)) as User;
            return user?.first_name || null;
        } catch (error) {
            console.error("Name extraction error:", error);
            return null;
        }
    }

    public initializeUserAgents(): Record<string, string> {
        const tokens = this.readFileLines(this.tokensFile);
        const availableUserAgents = this.readFileLines(this.userAgentsListFile);

        let userAgents: Record<string, string> = {};
        if (fs.existsSync(this.userAgentsFile)) {
            try {
                userAgents = JSON.parse(fs.readFileSync(this.userAgentsFile, "utf-8"));
            } catch (error) {
                console.warn("Failure to read existing user_agents.json, creation of a new one");
            }
        }

        tokens.forEach((token) => {
            const firstName = this.extractFirstName(token);
            if (firstName && !userAgents[firstName]) {
                userAgents[firstName] = this.generateUserAgent(availableUserAgents);
            }
        });

        fs.writeFileSync(this.userAgentsFile, JSON.stringify(userAgents, null, 2), "utf-8");

        return userAgents;
    }

    public getUserAgent(token: string): string | null {
        const userAgents = this.initializeUserAgents();
        const firstName = this.extractFirstName(token);

        return firstName ? userAgents[firstName] : null;
    }
}

export default UserAgentManager;
