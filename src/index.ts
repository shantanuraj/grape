import { getMonster } from "@/monster/fetch";

async function main() {
  const monsters = await Promise.all([
    "Astalos",
    "Bazelgeuse",
  ].map(getMonster));
  monsters.forEach((monster) => {
    console.log(monster);
  });
}

main();
