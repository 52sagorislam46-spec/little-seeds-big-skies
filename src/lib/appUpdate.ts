/**
 * In-app OTA (Over-The-Air) updater.
 *
 * The admin publishes the latest APK link + version + release notes into
 * Firestore (app_update/current). Every signed-in user then gets:
 *  - a broadcast notification in their notification list + a push message,
 *  - an on-screen "new version" banner,
 *  - a download icon with a red badge in the inbox header.
 *
 * Tapping download starts the APK download directly from inside the app —
 * the user never has to visit an external link.
 */
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { pushToUsers } from "./push";

export interface AppUpdate {
  version: string;
  downloadUrl: string;
  notes: string;
  publishedAt: number;
}

const UPDATE_DOC = "current";
const SEEN_KEY = "fly_update_seen_version";

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in (value as object)) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

function parseUpdate(data: Record<string, unknown> | undefined): AppUpdate | null {
  const version = data?.["version"];
  const downloadUrl = data?.["downloadUrl"];
  if (typeof version !== "string" || !version) return null;
  if (typeof downloadUrl !== "string" || !downloadUrl) return null;
  const notes = data?.["notes"];
  return {
    version,
    downloadUrl,
    notes: typeof notes === "string" ? notes : "",
    publishedAt: toMillis(data?.["publishedAt"]),
  };
}

/** Live subscription to the currently published app update. */
export function subscribeAppUpdate(cb: (update: AppUpdate | null) => void) {
  return onSnapshot(
    doc(db, "app_update", UPDATE_DOC),
    (snap) => {
      cb(parseUpdate(snap.data() as Record<string, unknown> | undefined));
    },
    () => cb(null),
  );
}

/** Live hook: the published update + whether this user hasn't seen it yet. */
export function useAppUpdate(): { update: AppUpdate | null; isNew: boolean } {
  const [update, setUpdate] = useState<AppUpdate | null>(null);
  const [seen, setSeen] = useState<string | null>(null);
  useEffect(() => {
    try {
      setSeen(localStorage.getItem(SEEN_KEY));
    } catch {
      setSeen(null);
    }
    return subscribeAppUpdate(setUpdate);
  }, []);
  const isNew = !!update && seen !== update.version;
  return { update, isNew };
}

/** Marks a version as seen so the banner/badge stop nagging this device. */
export function markUpdateSeen(version: string) {
  try {
    localStorage.setItem(SEEN_KEY, version);
  } catch {
    /* storage unavailable */
  }
}

async function allUserIds(): Promise<string[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.id);
}

/** Notifies every user (notification list + push) that a new version is out. */
export async function broadcastAppUpdate(update: {
  version: string;
  notes: string;
}) {
  try {
    const uids = await allUserIds();
    if (!uids.length) return;
    await addDoc(collection(db, "notifications"), {
      type: "admin" as const,
      actorId: "fly-admin",
      actorName: "Fly Update",
      actorPhoto: "",
      text:
        `Fly অ্যাপের নতুন ভার্সন ${update.version} এসেছে! ` +
        (update.notes ? update.notes : "নতুন ফিচার পেতে আপডেট করুন।"),
      mediaUrl: "",
      recipients: uids,
      readBy: [],
      createdAt: serverTimestamp(),
    });
    await pushToUsers({
      uids,
      title: `Fly ${update.version} এসেছে!`,
      body: update.notes || "নতুন ভার্সন ডাউনলোড করুন।",
      icon: "",
      link: "/",
      tag: `app_update_${Date.now()}`,
    });
  } catch {
    /* notifications are best effort */
  }
}

/** Admin only: publishes the new version and notifies everyone. */
export async function publishAppUpdate(input: {
  version: string;
  downloadUrl: string;
  notes: string;
}) {
  await setDoc(
    doc(db, "app_update", UPDATE_DOC),
    {
      version: input.version,
      downloadUrl: input.downloadUrl,
      notes: input.notes,
      publishedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await broadcastAppUpdate(input);
}

/** Sensible file name for the downloaded update. */
export function updateFileName(update: AppUpdate): string {
  try {
    const path = new URL(update.downloadUrl).pathname;
    const last = path.split("/").filter(Boolean).pop();
    if (last && /\.[a-z0-9]{2,6}$/i.test(decodeURIComponent(last))) {
      return decodeURIComponent(last);
    }
  } catch {
    /* relative or invalid URL — fall through */
  }
  return `fly-app-${update.version.replace(/[^\w.-]+/g, "_")}.apk`;
}

/**
 * Starts the APK download directly from inside the app.
 * First tries a background fetch (same-origin or CORS-enabled links) so the
 * download attribute works without leaving the app; otherwise hands the URL
 * straight to the phone's downloader.
 */
export async function startAppUpdateDownload(update: AppUpdate): Promise<void> {
  const filename = updateFileName(update);
  try {
    const res = await fetch(update.downloadUrl, { mode: "cors" });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  } catch {
    /* CORS or network — fall through to a direct download */
  }
  const a = document.createElement("a");
  a.href = update.downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
