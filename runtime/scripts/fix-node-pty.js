// node-pty's prebuilt spawn-helper is published without the execute bit on macOS,
// which makes every terminal fail with "posix_spawnp failed". Restore it after install.
const fs = require("fs");
const path = require("path");

const prebuilds = path.join(__dirname, "../node_modules/node-pty/prebuilds");
if (fs.existsSync(prebuilds)) {
  for (const platform of fs.readdirSync(prebuilds)) {
    const helper = path.join(prebuilds, platform, "spawn-helper");
    if (fs.existsSync(helper)) fs.chmodSync(helper, 0o755);
  }
}
