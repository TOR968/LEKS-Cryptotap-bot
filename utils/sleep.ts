async function sleep(ms: number): Promise<void> {
    const startTime = Date.now();
    const updateInterval = 100;

    return new Promise<void>((resolve) => {
        const timer = setInterval(() => {
            const remaining = Math.max(0, ms - (Date.now() - startTime));
            const message = `Sleeping... ${(remaining / 1000).toFixed(1)}s remaining`;

            process.stdout.write("\r" + message.padEnd(50));

            if (remaining <= 0) {
                clearInterval(timer);
                process.stdout.write("\r" + " ".repeat(50) + "\r");
                resolve();
            }
        }, updateInterval);
    });
}

export default sleep;
