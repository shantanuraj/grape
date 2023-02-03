import { JSDOM } from "jsdom";
import fetch from "node-fetch";

export const BASE_URL = "https://game8.co/games/Monster-Hunter-Rise/archives/";

const getURL = (id: number) => BASE_URL + id;

export const getPage = async (id: number): Promise<HTMLElement | null> => {
  const html = await fetch(getURL(id))
    .then((res) => res.text())
    .catch((err) => {
      console.error(err);
    });
  if (!html) return null;

  const dom = new JSDOM(html);
  return dom.window.document.querySelector(
    ".archive-style-wrapper"
  ) as HTMLElement;
};
