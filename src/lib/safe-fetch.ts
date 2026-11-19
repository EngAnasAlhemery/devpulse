
import { lookup } from "node:dns/promises";
import type { ConnectionOptions } from "node:tls";
import { Agent, fetch as undiciFetch } from "undici";
import * as ipaddr from "ipaddr.js";

type ResolvedAddress = {
  address: string;
  family: number;
};

function isPublicAddress(address: string): boolean {
  try {
    const parsed = ipaddr.process(address);
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}

async function resolvePublicAddress(
  hostname: string
): Promise<ResolvedAddress> {
  let addresses: ResolvedAddress[];

  if (ipaddr.isValid(hostname)) {
    const parsed = ipaddr.parse(hostname);

    addresses = [
      {
        address: hostname,
        family: parsed.kind() === "ipv6" ? 6 : 4,
      },
    ];
  } else {
    addresses = await lookup(hostname, {
      all: true,
      verbatim: true,
    });
  }

  if (addresses.length === 0) {
    throw new Error("Hostname did not resolve to an IP address");
  }

  if (addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("Private or reserved IP addresses are not allowed");
  }

  return addresses[0];
}

export async function validatePublicHttpUrl(
  input: string
): Promise<string> {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  if (url.username || url.password) {
    throw new Error("URLs containing credentials are not allowed");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  if (!hostname || hostname === "localhost") {
    throw new Error("Localhost addresses are not allowed");
  }

  await resolvePublicAddress(hostname);

  return url.toString();
}

export async function safeFetch(
  input: string,
  timeoutMs = 10_000
): Promise<{ statusCode: number; isUp: boolean }> {
const url = new URL(await validatePublicHttpUrl(input));
  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  const resolved = await resolvePublicAddress(hostname);


const pinnedLookup = ((
  requestedHostname: string,
  options: { all?: boolean },
  callback: (
    error: NodeJS.ErrnoException | null,
    address: string | ResolvedAddress[],
    family?: number
  ) => void
) => {
  if (requestedHostname.toLowerCase() !== hostname.toLowerCase()) {
    const error = new Error(
      "Unexpected hostname"
    ) as NodeJS.ErrnoException;

    error.code = "EACCES";

    if (options?.all) {
      callback(error, []);
    } else {
      callback(error, "", 0);
    }

    return;
  }

  if (options?.all) {
    callback(null, [resolved]);
  } else {
    callback(null, resolved.address, resolved.family);
  }
}) as NonNullable<ConnectionOptions["lookup"]>;


  const agent = new Agent({
    connect: {
      lookup: pinnedLookup,
    },
  });

  try {
    const response = await undiciFetch(url, {
      method: "GET",
      dispatcher: agent,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    const result = {
      statusCode: response.status,
      isUp: response.status >= 200 && response.status < 300,
    };

    await response.body?.cancel().catch(() => undefined);

    return result;
  } finally {
    await agent.close();
  }
}
