import { registerHealthPing } from "@/platform/ping";
import express from "express";

function main() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  registerHealthPing(app);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main();
