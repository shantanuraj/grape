import pLimit from "p-limit";
import { getMonster } from "@/monster/fetch";
import { getMonsterList } from "@/monster/list";

const limit = pLimit(3);

async function main() {
  const monsterList = await getMonsterList();
  const monsterRequests = (monsterList ?? []).map(getMonster);

  const monsters = await Promise.all(monsterRequests);
  console.log(JSON.stringify(monsters, null, 2));
}

main();
