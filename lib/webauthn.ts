// @/lib/webauthn.ts

import { Buffer } from "buffer";

// Check if WebAuthn is supported in the browser
export function isWebAuthnSupported(): boolean {
    return !!window.PublicKeyCredential;
}

// Check if a platform authenticator (e.g., Face ID, Touch ID) is available
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!isWebAuthnSupported()) return false;
    try {
        const result = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return result;
    } catch {
        return false;
    }
}

// Check if the browser is Safari on iOS
export function isIOSSafari(): boolean {
    const ua = navigator.userAgent;
    return /iP(ad|hone|od)/.test(ua) && /Safari/.test(ua) && !/CriOS|EdgiOS|FxiOS|OPiOS/.test(ua);
}

// Helper to convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    return Buffer.from(buffer).toString("base64");
}

// Helper to convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Generate registration options for WebAuthn credential creation
export function createRegistrationOptions(email: string): PublicKeyCredentialCreationOptions {
    const userId = new TextEncoder().encode(email);
    return {
        challenge: new Uint8Array(32), // In production, generate a secure random challenge
        rp: {
            name: "Zero",
            id: window.location.hostname,
        },
        user: {
            id: userId,
            name: email,
            displayName: email,
        },
        pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ES256
            { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
        },
        timeout: 60000,
        attestation: "direct",
    };
}

// Generate authentication options for WebAuthn credential assertion
export function createAuthenticationOptions(): PublicKeyCredentialRequestOptions {
    return {
        challenge: new Uint8Array(32), // In production, generate a secure random challenge
        allowCredentials: [], // Will be populated with stored credential IDs
        timeout: 60000,
        userVerification: "required",
    };
}