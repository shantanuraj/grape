import fetch from "node-fetch";

import { EntityType } from "@/types";

const getURL = (entity: EntityType, name: string) => {
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

export const getPage = (entity: EntityType, name: string) =>
  fetch(getURL(entity, name).toString())
    .then((res) => res.text())
    .catch((err) => {
      console.error(err);
    });
