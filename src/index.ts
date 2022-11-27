import { getMonster } from "@/monster/fetch";

async function main() {
  const monster = await getMonster("Astalos");
  console.log(monster);
}

main();