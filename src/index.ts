import { getMonster } from "@/monster/fetch";
import { getMonsterList } from "./monster/list";

async function main() {
  const monsterList = await getMonsterList();

  const monsters = await Promise.all((monsterList ?? []).map(getMonster));
  console.log(JSON.stringify(monsters, null, 2));
}

main();
