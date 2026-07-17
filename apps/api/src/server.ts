import { createServer } from "node:http";

import { createApp } from "./config/app";
import { env } from "./config/env";
import { createSocketServer } from "./sockets";

const app = createApp();
const server = createServer(app);

createSocketServer(server);

server.listen(env.PORT, () => {
  console.log(`SkillSync API listening on http://localhost:${env.PORT}`);
});

