import pLimit from "p-limit";
import { getMonsterList } from "@/monster/list";
import { getMonster } from "./monster/fetch";

const limit = pLimit(1);

async function main() {
  const monsterIds = await getMonsterList();
  if (!monsterIds.length) throw Error("Could not get monster ids");
  const monsterRequests = monsterIds
    .slice(0, 1)
    .map((id) => limit(() => getMonster(id)));

  const monsters = await Promise.all(monsterRequests);
  // console.log(JSON.stringify(monsters, null, 2));
}

main();
