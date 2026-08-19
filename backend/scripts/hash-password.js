import bcrypt from "bcryptjs";

const password = "Admin123@";

const hash = await bcrypt.hash(password, 10);

console.log("\n============================");
console.log("Mot de passe :", password);
console.log("Hash bcrypt :");
console.log(hash);
console.log("============================");