import crypto from "crypto";

export function generateAnonId() {
    return crypto.randomBytes(16).toString("hex");
}