import { JSDOM } from "jsdom";
import { getPage } from "@/wiki";

export async function getMonsterList(): Promise<string[] | undefined> {
  const html = await getPage("Monster");
  if (!html) return;
  const dom = new JSDOM(html);
  const page = dom.window.document;

  try {
    const monsterLinks = page.querySelectorAll<HTMLAnchorElement>(
      "a[title^='Monster']"
    );

    return Array.from(monsterLinks).map((l) => l.textContent as string);
  } catch (err) {
    console.error(err);
    return;
  }
}
