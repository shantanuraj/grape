import { getMonster } from "@/monster/fetch";

async function main() {
  const monsters = await Promise.all([
    getMonster("Astalos"),
    getMonster("Bazelgeuse"),
  ]);
  monsters.forEach((monster) => {
    console.log(monster);
  });
}

main();
