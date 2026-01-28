import crypto from "node:crypto";

const hashToken = (token) => {
  // hash the token using sha256
  return crypto.createHash("sha256").update(token.toString()).digest("hex");
};

export default hashToken;


// So process is:

// RAW TOKEN (email link)
// → HASH IT
// → STORE HASH IN DB


// Later:

// User clicks link → RAW token
// → hash again
// → compare with DB


// Same logic as bcrypt, but:

// bcrypt → passwords

// sha256 → tokens (fast, deterministic)


///////// hashToken.js ensures that even if DB is compromised, attackers cannot use reset/verify tokens.