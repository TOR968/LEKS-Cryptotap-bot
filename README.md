# LEKS-Cryptotap-bot

| ✅  | Feature                     |
| --- | ---------------------------------|
| ✅ | Automatic tapping                  |
| ✅ | Automatic daily rewards collection |
| ✅ | Multiple account support           |
| ✅ | Proxy support (SOCKS/HTTP)         |
| ✅ | User-Agent rotation                |
| ✅ | Scheduled runs                     |

## For suggestions or to report a bug, please contact [telegram](https://t.me/tor_dev)

## [Support the development 💙](https://support-me-ruby.vercel.app/)

## Installation

### Clone the repository:

```bash
git clone https://github.com/TOR968/LEKS-Cryptotap-bot.git
cd LEKS-Cryptotap-bot
```

### Install dependencies:

```bash
npm install
```

### Configure accounts in data.txt:

Add your Telegram account userid\queryid format:

```
query_id_1
query_id_2
query_id_3
```

You can add multiple accounts, each on a new line.

### (Optional) Add proxies to proxy.txt:

```
http://user:pass@host:port
https://user:pass@host:port
socks4://user:pass@host:port
socks5://user:pass@host:port
```

### Settings in config.json:

```json
{
    "useProxy": true, // true/false
    "runIntervalHours": 2 // 2-24
    // leave the following values unchanged
}
```

## How to get `data.txt`

1. Open LEKS Cryptotap in Telegram or browser
2. Open Developer Tools (F12)
3. Go to the `Application` tab (or Network)
4. Find the `tgWebAppData` parameter or intercept an API request
5. Copy the entire value and paste it into `data.txt`

![](./utils/img/image.png)

## Usage

### Run the bot:

```bash
npm run dev
```

Or compile and run:

```bash
npm run build
npm start
```

## Disclaimer

This bot is created for educational purposes only. Use at your own risk and responsibility.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
