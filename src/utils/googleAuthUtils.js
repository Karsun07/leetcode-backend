const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verifies the ID token (JWT) that Google's Identity Services button hands
// back to the frontend. Google signs this token with keys that rotate
// automatically; the library fetches Google's current public keys and
// checks the signature, expiry, and that it was issued for OUR client ID
// (the 'audience') — so a token minted for some other app can't be replayed
// here. Throws if anything about the token is invalid.
const verifyGoogleToken = async (idToken) => {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    return {
        googleId: payload.sub,           // Google's stable unique user id
        email: payload.email,
        emailVerified: payload.email_verified,
        firstName: payload.given_name || payload.name || "User",
    };
};

module.exports = { verifyGoogleToken }; 