import "dotenv/config";
import { resetPasswordDemo } from "./src/lib/auth/password-auth";
(async () => {
  console.log("reset admin  (temuge)  ->", JSON.stringify(await resetPasswordDemo("temugeg1@gmail.com", "Whatever!99")));
  console.log("reset normal (tuguldur)->", JSON.stringify(await resetPasswordDemo("tuguldur", "Whatever!99")));
})();
