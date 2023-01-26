import fetch from "node-fetch";

import { EntityType } from "@/types";

const getURL = (name: string, entity?: EntityType) => {
  const title = (() => {
    switch (entity) {
      case "monster":
        return `Monster/${name}`;
      case "armor":
        return `Armor/${name}`;
      default:
        return name;
    }
  })();
  const url = new URL(`https://gamecat.fun/en/index.php`);
  url.searchParams.set("title", title);
  return url;
};

export const getPage = (name: string, entity?: EntityType) =>
  fetch(getURL(name, entity).toString())
    .then((res) => res.text())
    .catch((err) => {
      console.error(err);
    });
