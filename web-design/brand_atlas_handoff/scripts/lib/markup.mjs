// 로고 타일·이름 목록 등 허브·브랜드 페이지가 공유하는 마크업.
import { esc } from "./page-shell.mjs";
import { displayName, koreanName, latinName, urlSlugOf, countryOf, foundedYear } from "./brand-seo.mjs";
import { hasLogo, isRealAsset } from "./archive.mjs";

export const brandHref = (b, prefix = "../") => `${prefix}brand/${encodeURIComponent(urlSlugOf(b))}.html`;
export const assetHref = (src, prefix = "../") => {
  const clean = String(src || "").replace(/^\.\.\//, "").replaceAll("\\", "/");
  return /^https?:\/\//.test(clean) ? clean : `${prefix}${clean}`;
};

export function initials(b) {
  const en = String(b.nameEn || "").trim();
  const ko = String(koreanName(b) || b.name || "").trim();
  if (/^[\x00-\x7F]+$/.test(en) && en) {
    const words = en.replace(/\b(the|inc|co|ltd|corp|company|group|gmbh|sa|ag)\.?\b/gi, "").split(/[^A-Za-z0-9]+/).filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return (words[0] || en).slice(0, 2).toUpperCase();
  }
  return ko.replace(/\s+/g, "").slice(0, 2) || "BA";
}

export function wordmark(b) {
  return `<div class="brand-wordmark" role="img" aria-label="${esc(displayName(b))} 로고 없음"><span class="wordmark-initials">${esc(initials(b))}</span><strong>${esc(koreanName(b) || latinName(b) || b.name)}</strong></div>`;
}

/** 로고 <img> 또는 워드마크. 로고가 없을 때 사진으로 대체하지 않는다(타일이 뒤섞여 보인다). */
export function logoImg(b, prefix = "../", { lazy = true, width = 240, height = 180 } = {}) {
  if (!hasLogo(b)) return wordmark(b);
  return `<img src="${assetHref(b.logo, prefix)}" alt="${esc(displayName(b))} 로고" width="${width}" height="${height}"${lazy ? ' loading="lazy"' : ""} decoding="async">`;
}

/** 브랜드 타일 — 로고 + 한글명 + 원어 + (산업). */
export function tile(b, prefix = "../", { sub = "industry", eager = false, desc = false } = {}) {
  const ko = koreanName(b);
  const en = latinName(b);
  const title = ko || en || b.name;
  const line2 = ko && en && ko.toLowerCase() !== en.toLowerCase() ? en : "";
  const meta = sub === "industry" ? (b.industry || "")
    : sub === "origin" ? [countryOf(b), foundedYear(b) ? `${foundedYear(b)}년` : ""].filter(Boolean).join(" · ")
    : sub === "none" ? "" : String(sub || "");
  const d = desc ? oneLine(b, 80) : "";
  return `<a class="tile" href="${brandHref(b, prefix)}"><span class="art">${logoImg(b, prefix, { lazy: !eager })}</span><span class="txt"><b>${esc(title)}</b>${line2 ? `<small>${esc(line2)}</small>` : ""}${meta ? `<em>${esc(meta)}</em>` : ""}${d ? `<p>${esc(d)}</p>` : ""}</span></a>`;
}

export function tiles(brands, prefix = "../", opts = {}) {
  return `<div class="tiles${opts.size ? ` ${opts.size}` : ""}">${brands.map((b, i) => tile(b, prefix, { ...opts, eager: opts.eagerFirst && i < 12 })).join("")}</div>`;
}

/** 이름 목록 항목(미니 로고 + 한글(원어)). 대량 목록용. */
export function nameItem(b, prefix = "../", { desc = false } = {}) {
  const ko = koreanName(b), en = latinName(b);
  const d = desc ? oneLine(b, 90) : "";
  const mini = hasLogo(b)
    ? `<img class="mini" src="${assetHref(b.logo, prefix)}" alt="" width="34" height="26" loading="lazy" decoding="async">`
    : `<span class="mini none" aria-hidden="true"></span>`;
  const label = ko && en && ko.toLowerCase() !== en.toLowerCase() ? `${esc(ko)} <span class="en">${esc(en)}</span>` : esc(ko || en || b.name);
  return `<a href="${brandHref(b, prefix)}">${mini}<span>${label}${d ? `<small class="desc">${esc(d)}</small>` : ""}</span></a>`;
}

export function nameList(brands, prefix = "../", opts = {}) {
  return `<div class="name-list${opts.desc ? " with-desc" : ""}">${brands.map(b => nameItem(b, prefix, opts)).join("")}</div>`;
}

/** 첫 문장. 없는 말을 만들지 않는다. */
export function oneLine(b, limit = 95) {
  const raw = String(b.definition || b.summary || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  const m = /^[\s\S]{10,}?(?:다\.|요\.|[.!?])(?=\s|$)/.exec(raw);
  const first = m ? m[0].trim() : raw;
  if (first.length <= limit) return first;
  const cut = first.slice(0, limit);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > limit * 0.6 ? cut.slice(0, sp) : cut).trim()}…`;
}

export { isRealAsset };
