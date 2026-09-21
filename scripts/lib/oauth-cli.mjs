// Authorization-code flow from the terminal, shared by the token helpers.
//
//   default                        local callback server + opens your browser
//   --print-url                    print the authorize URL and exit
//   --code=<code | redirected URL> skip the server; exchange a pasted code
//                                  (paste the whole URL the browser landed on)
import { createServer } from "node:http";
import { spawn } from "node:child_process";

export function argValue(name) {
  const hit = process.argv.find((arg) => arg === `--${name}` || arg.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : true;
}

export function parsePastedCode(input) {
  try {
    const url = new URL(input);
    return { code: url.searchParams.get("code"), params: url.searchParams };
  } catch {
    return { code: input.trim(), params: new URLSearchParams() };
  }
}

function openBrowser(url) {
  const [cmd, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];
  try {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
  } catch {
    // no browser here — the URL is printed anyway
  }
}

function page(title, body) {
  return `<!doctype html><meta charset="utf-8"><title>${title}</title><body style="font:16px/1.5 system-ui;background:#06070b;color:#e8e6e1;padding:3rem"><h1 style="font-weight:300">${title}</h1><p>${body}</p></body>`;
}

export async function runAuthorizationCode({ label, authorizeUrl, redirectUri, state, exchange }) {
  if (argValue("print-url")) {
    console.log(authorizeUrl);
    return;
  }

  const pasted = argValue("code");
  if (typeof pasted === "string") {
    const { code, params } = parsePastedCode(pasted);
    if (!code) throw new Error("No authorization code found in --code.");
    await exchange(code, params);
    return;
  }

  const callback = new URL(redirectUri);
  await new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", redirectUri);
      if (url.pathname !== callback.pathname) {
        res.writeHead(404).end();
        return;
      }
      const finish = (status, title, body) => {
        res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
        res.end(page(title, body));
        server.close();
      };

      const error = url.searchParams.get("error");
      if (error) {
        finish(400, `${label} authorization failed`, error);
        reject(new Error(`${label} authorization failed: ${error}`));
        return;
      }
      if (url.searchParams.get("state") !== state) {
        finish(400, "State mismatch", "Restart the helper and try again.");
        reject(new Error("State mismatch — restart the helper."));
        return;
      }
      const code = url.searchParams.get("code");
      if (!code) {
        finish(400, "Missing code", "Restart the helper and try again.");
        reject(new Error("Missing authorization code."));
        return;
      }

      try {
        await exchange(code, url.searchParams);
        finish(200, `${label} connected`, "Return to your terminal. The token was saved to .env.local.");
        resolve();
      } catch (exchangeError) {
        finish(500, `${label} token exchange failed`, "Return to your terminal for the error.");
        reject(exchangeError);
      }
    });

    server.on("error", reject);
    server.listen(Number(callback.port || 80), callback.hostname, () => {
      console.log(`Waiting for ${label} at ${redirectUri}`);
      console.log(`\nApprove the app in the browser window that just opened. If none opened, visit:\n\n${authorizeUrl}\n`);
      openBrowser(authorizeUrl);
    });
  });
}
