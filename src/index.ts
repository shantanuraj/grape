import { getMonster } from "@/monster/fetch";

async function main() {
  const monsters = await Promise.all([
    "Astalos",
    "Bazelgeuse",
  ].map(getMonster));
  console.log(JSON.stringify(monsters, null, 2));
}

main();
