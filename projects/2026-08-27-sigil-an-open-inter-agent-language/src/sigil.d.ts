export type SigilVerb = "REQUEST" | "INFORM" | "ORDER" | "ACK" | "REFUSE" | "CLOSE";
export type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };

export interface SigilEnvelope {
  sigil: "1";
  sender: string;
  seq: number;
  verb: SigilVerb;
  body: { [key: string]: JsonValue };
}

export const VERSION: "1";
export const PREFIX: "SIGIL1.";
export const VERBS: readonly SigilVerb[];
export function validateEnvelope(envelope: SigilEnvelope): SigilEnvelope;
export function encodeEnvelope(envelope: SigilEnvelope): string;
export function decodeEnvelope(wire: string): SigilEnvelope;
export function createHandshake(sender: string, seq?: number, accepts?: readonly SigilVerb[]): string;
export function acceptHandshake(wire: string, sender: string, seq?: number): string;
