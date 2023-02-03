import { getMonsterList } from "@/monster/list";

async function main() {
  const monsterList = await getMonsterList();
  console.log(JSON.stringify(monsterList));
}

main();
