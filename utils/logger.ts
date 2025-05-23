interface Colors {
    reset: string;
    blue: string;
    green: string;
    yellow: string;
    red: string;
    magenta: string;
    cyan: string;
    orange: string;
    purple: string;
    [key: string]: string;
}

type LogType = "info" | "success" | "warning" | "error" | "proxy" | "registration" | "ping" | "task";

const colors: Colors = {
    reset: "\x1b[0m",
    blue: "\x1b[34m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    orange: "\x1b[38;2;255;165;0m",
    purple: "\x1b[38;2;128;0;128m",
};

function logWithColor(user: string | number, message: string, type: LogType = "info"): void {
    const colorMap: Record<LogType, string> = {
        info: colors.blue,
        success: colors.green,
        warning: colors.yellow,
        error: colors.red,
        proxy: colors.magenta,
        registration: colors.cyan,
        ping: colors.orange,
        task: colors.purple,
    };

    const color = colorMap[type] || colors.blue;
    console.log(`${color}[${user}] ${message} ${colors.reset}`);
}

export { colors, logWithColor, LogType };
