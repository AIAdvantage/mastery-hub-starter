#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const API = process.env.CIRCLE_ADMIN_API_BASE || "https://app.circle.so/api/admin/v2";
const KEY = process.env.CIRCLE_ADMIN_API_KEY;
const SPACE_ID = process.env.CIRCLE_CHALLENGE_SUBMISSIONS_SPACE_ID || "2370867";
const SOURCE_URL = "https://community.aiadvantage.com/c/challenge-submissions/";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg, index, all) => (
    arg.startsWith("--") ? [arg.slice(2), all[index + 1]?.startsWith("--") ? true : all[index + 1] || true] : []
  )).filter(Boolean)
);

const month = String(args.month || "july").toLowerCase();
const label = String(args.label || `${month[0].toUpperCase()}${month.slice(1)}`);
const since = String(args.since || "2026-07-01");
const challenge = String(args.challenge || "Paint Your AI Hub");
const imageLimit = Number(args.imageLimit || 4);
const imageMaxEdge = Number(args.imageMaxEdge || 1400);

if (!KEY) {
  throw new Error("CIRCLE_ADMIN_API_KEY is required. Source ~/clawd/.env.circle first.");
}

function stripHtml(html = "") {
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(text = "", length = 260) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= length) return clean;
  return `${clean.slice(0, length).replace(/\s+\S*$/, "")}...`;
}

function summaryFromText(text = "", title = "") {
  const clean = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [];
  const base = sentences.find((sentence) => sentence.length > 60) || clean || title || "Image-only challenge submission with visual proof attached.";
  return excerpt(base, 220);
}

function sourceTags(text = "", title = "") {
  const haystack = `${title} ${text}`.toLowerCase();
  const tags = [];
  const checks = [
    ["Mobile-first", /\bmobile|phone|one-handed|bottom nav|responsive\b/],
    ["Dark mode", /\bdark|obsidian|night|black|cockpit\b/],
    ["Minimal", /\bminimal|simple|clean|quiet|reduced|less\b/],
    ["Brand-driven", /\bbrand|logo|business|company|website|palette\b/],
    ["Personal theme", /\bpersonal|family|sanctuary|home|nook|faith|life\b/],
    ["Visual redesign", /\bpaint|look|feel|theme|design|ui|interface|visual\b/],
    ["Published hub", /\blovable\.app|published|live hub|website\b/],
  ];
  for (const [label, regex] of checks) {
    if (regex.test(haystack)) tags.push(label);
  }
  return tags.length ? tags.slice(0, 4) : ["Hub redesign"];
}

function interestCategories(text = "", title = "", imageCount = 0) {
  const haystack = `${title} ${text}`.toLowerCase();
  const categories = ["All"];
  if (/\bmobile|phone|one-handed|bottom nav|responsive\b/.test(haystack)) categories.push("Mobile-first");
  if (/\bdark|obsidian|night|black|cockpit|sci fi|space\b/.test(haystack)) categories.push("Dark / cinematic");
  if (/\bminimal|simple|clean|quiet|reduced|less|apple|field notes\b/.test(haystack)) categories.push("Minimal / calm");
  if (/\bbrand|logo|business|company|website|newsletter|real estate|clinic|client\b/.test(haystack)) categories.push("Business branded");
  if (/\bfamily|personal|sanctuary|home|faith|life|coach|nook|constellation|wildlife|watch\b/.test(haystack)) categories.push("Personal identity");
  if (imageCount >= 6) categories.push("Rich visual proof");
  return [...new Set(categories)];
}

function hubLinks(html = "") {
  const links = [...String(html).matchAll(/<a[^>]+href="([^"]+)"/g)].map((match) => match[1]);
  return links.filter((url) => /lovable\.app|\.ai\b|https?:\/\/[^/]+\/?$/i.test(url)).slice(0, 4);
}

function assetLinks(html = "") {
  return [...String(html).matchAll(/<a[^>]+href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => /assets-v2\.circle\.so|rails\/active_storage/i.test(url));
}

function imageUrls(html = "") {
  return [...String(html).matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]);
}

function isLostPost(post, text, images, links) {
  const haystack = `${post.name || ""} ${text}`.toLowerCase();
  if (/stuck|quick assist|need help|lost the thread|looking for .*assist|where.*stuck/.test(haystack)) return true;
  if (!images.length && !links.length && !/submission|challenge|hub|paint|design|published|lovable/.test(haystack)) return true;
  return false;
}

async function circle(pathname) {
  const response = await fetch(`${API}/${pathname}`, {
    headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Circle HTTP ${response.status}: ${await response.text()}`);
  return response.json();
}

async function fetchAllPosts() {
  const posts = [];
  let page = 1;
  while (true) {
    const data = await circle(`posts?space_id=${SPACE_ID}&page=${page}&per_page=100&sort=latest`);
    posts.push(...(data.records || []));
    if (!data.has_next_page) return posts;
    page += 1;
  }
}

async function download(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const type = response.headers.get("content-type") || "";
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return { type, size: buffer.length };
}

async function sipsConvert(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("sips", ["-Z", String(imageMaxEdge), "-s", "format", "jpeg", inputPath, "--out", outputPath], {
      stdio: "ignore",
    });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`sips exited ${code}`)));
  });
}

function extFromContentType(type = "", fallback = ".jpg") {
  if (type.includes("png")) return ".png";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";
  if (type.includes("webp")) return ".webp";
  if (type.includes("gif")) return ".gif";
  if (type.includes("heic")) return ".heic";
  return fallback;
}

async function main() {
  const allPosts = await fetchAllPosts();
  const monthPosts = allPosts.filter((post) => String(post.published_at || post.created_at) >= since);
  const assetDir = path.join(ROOT, "public", "challenge-archive-assets", `${month}-challenge`);
  await fs.mkdir(assetDir, { recursive: true });

  const submissions = [];
  const excluded = [];
  let imageIndex = 1;

  for (const post of monthPosts) {
    const html = post.body?.body || "";
    const text = stripHtml(html);
    const remoteImages = [...new Set([...imageUrls(html), ...assetLinks(html)])];
    const links = hubLinks(html);
    const lost = isLostPost(post, text, remoteImages, links);
    if (lost) {
      excluded.push({
        id: String(post.id),
        title: post.name || "Untitled",
        author: post.user_name || "Unknown",
        reason: "Not an actual challenge submission",
        url: post.url || `${SOURCE_URL}${post.slug}`,
      });
      continue;
    }

    const displayImages = [];
    for (const [localIndex, url] of remoteImages.slice(0, imageLimit).entries()) {
      const baseName = `${String(imageIndex).padStart(2, "0")}-${post.id}-${localIndex + 1}`;
      const tempPath = path.join(assetDir, `${baseName}.asset`);
      try {
        const meta = await download(url, tempPath);
        const finalName = `${baseName}.jpg`;
        const finalPath = path.join(assetDir, finalName);
        if (/image\/(png|jpe?g|webp|heic)/i.test(meta.type)) {
          await sipsConvert(tempPath, finalPath);
          await fs.rm(tempPath, { force: true });
        } else {
          await fs.rm(tempPath, { force: true });
          continue;
        }
        displayImages.push({
          src: `/challenge-archive-assets/${month}-challenge/${finalName}`,
          alt: `${post.name || "Challenge submission"} screenshot`,
        });
        imageIndex += 1;
      } catch (error) {
        await fs.rm(tempPath, { force: true });
      }
    }

    submissions.push({
      id: String(post.id),
      month,
      challenge,
      title: post.name || "Untitled challenge submission",
      author: post.user_name || "Unknown",
      publishedAt: post.published_at || post.created_at || "",
      comments: post.comments_count || 0,
      likes: post.likes_count || 0,
      url: post.url || `${SOURCE_URL}${post.slug}`,
      hubLinks: links,
      summary: summaryFromText(text, post.name || ""),
      excerpt: excerpt(text, 420),
      interests: interestCategories(text, post.name || "", remoteImages.length),
      sourceTags: sourceTags(text, post.name || ""),
      imageCount: remoteImages.length,
      displayImages,
      attachmentCount: remoteImages.length + links.length,
      status: "eligible",
    });
  }

  const interestCategoriesList = [
    "All",
    "Mobile-first",
    "Dark / cinematic",
    "Minimal / calm",
    "Business branded",
    "Personal identity",
    "Rich visual proof",
  ].filter((category) => category === "All" || submissions.some((submission) => submission.interests.includes(category)));

  const archive = {
    scrapedAt: new Date().toISOString(),
    source: "Circle Admin API v2",
    sourceUrl: SOURCE_URL,
    month,
    label,
    title: `${label} Challenge Submission Registry`,
    theme: challenge,
    description: "Member submissions from the AI Mastery Challenge Submissions space, filtered for real challenge posts with summaries, source links, reactions, comments, and available hub screenshots.",
    rawPostCount: monthPosts.length,
    excludedPostCount: excluded.length,
    submissionCount: submissions.length,
    imageAssetCount: submissions.reduce((count, item) => count + item.displayImages.length, 0),
    interestCategories: interestCategoriesList,
    excluded,
    submissions,
  };

  const jsonPath = path.join(ROOT, "src", "data", `${month}ChallengeArchive.json`);
  const jsPath = path.join(ROOT, "src", "data", `${month}ChallengeArchive.js`);
  await fs.mkdir(path.dirname(jsonPath), { recursive: true });
  await fs.writeFile(jsonPath, `${JSON.stringify(archive, null, 2)}\n`);
  await fs.writeFile(jsPath, `export const ${month.toUpperCase()}_CHALLENGE_ARCHIVE = ${JSON.stringify(archive, null, 2)};\n`);

  console.log(JSON.stringify({
    rawPostCount: archive.rawPostCount,
    excludedPostCount: archive.excludedPostCount,
    submissionCount: archive.submissionCount,
    imageAssetCount: archive.imageAssetCount,
    jsonPath,
    jsPath,
    assetDir,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
