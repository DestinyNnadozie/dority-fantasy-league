import { PrismaClient, Position } from "@prisma/client";
const prisma = new PrismaClient();

const monaco: { firstName: string; lastName: string; position: Position; price: number }[] = [
  { firstName: "Egbe", lastName: "Bethel", position: "GK", price: 200 },
  { firstName: "Okeke", lastName: "Jeswill", position: "DEF", price: 50 },
  { firstName: "Akonye", lastName: "Bright", position: "DEF", price: 50 },
  { firstName: "Ezeafuegwu", lastName: "John", position: "DEF", price: 50 },
  { firstName: "Okeakpu", lastName: "Olisaemeka", position: "DEF", price: 50 },
  { firstName: "Nnona", lastName: "Peter", position: "DEF", price: 50 },
  { firstName: "Echekam", lastName: "Kamsiyochi", position: "DEF", price: 50 },
  { firstName: "Enu", lastName: "Ezeugo", position: "DEF", price: 200 },
  { firstName: "Iheanyichi", lastName: "Eminence", position: "DEF", price: 50 },
  { firstName: "Nnona", lastName: "Munachimso", position: "DEF", price: 100 },
  { firstName: "Ndubuisi", lastName: "Emmanuel", position: "DEF", price: 100 },
  { firstName: "Ibezue", lastName: "Chinedu", position: "DEF", price: 300 },
  { firstName: "Okezie", lastName: "David", position: "DEF", price: 100 },
  { firstName: "Isaac", lastName: "Godswill", position: "DEF", price: 50 },
  { firstName: "Emmanuel", lastName: "Goodluck", position: "DEF", price: 50 },
  { firstName: "Friday", lastName: "Otuekong", position: "MID", price: 50 },
  { firstName: "Okonkwo", lastName: "Justin", position: "MID", price: 50 },
  { firstName: "Ezeadichie", lastName: "Jideofu", position: "MID", price: 50 },
  { firstName: "Ayogwokai", lastName: "Oshomah", position: "MID", price: 50 },
  { firstName: "Okonkwo", lastName: "Gerald", position: "MID", price: 100 },
  { firstName: "Nwosu", lastName: "Obinna", position: "MID", price: 150 },
  { firstName: "Ibe", lastName: "Emmanuel", position: "MID", price: 200 },
  { firstName: "Onyema", lastName: "Chibueze", position: "MID", price: 100 },
  { firstName: "Eze", lastName: "Enyinnaya Wisdom", position: "FWD", price: 50 },
  { firstName: "Asiegbu", lastName: "Munachi", position: "FWD", price: 50 },
  { firstName: "Kalu", lastName: "Jules", position: "FWD", price: 200 },
  { firstName: "Alokalam", lastName: "David", position: "FWD", price: 100 },
  { firstName: "Alex", lastName: "Chinedu", position: "FWD", price: 200 },
  { firstName: "Nkuma-Udah", lastName: "Kenneth", position: "FWD", price: 200 }
];

async function main() {
  const old = await prisma.schoolPlayer.findMany({ where: { teamName: "Monaco" } });
  const ids = old.map((p) => p.id);
  if (ids.length) {
    await prisma.squadPick.deleteMany({ where: { playerId: { in: ids } } });
    await prisma.transfer.deleteMany({ where: { OR: [{ playerInId: { in: ids } }, { playerOutId: { in: ids } }] } });
    await prisma.playerGameweekStat.deleteMany({ where: { playerId: { in: ids } } });
    await prisma.schoolPlayer.deleteMany({ where: { teamName: "Monaco" } });
  }
  for (const p of monaco) {
    await prisma.schoolPlayer.create({ data: { ...p, teamName: "Monaco" } });
  }
  console.log("Monaco players:", monaco.length);
}

main().then(() => prisma.$disconnect());
