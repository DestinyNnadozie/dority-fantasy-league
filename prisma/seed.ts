import { PrismaClient, Position, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const players: { firstName: string; lastName: string; position: Position; price: number; teamName: string }[] = [
  { firstName: "Enukeme", lastName: "Pascal", position: "MID", price: 50, teamName: "Marseille" },
  { firstName: "Dim", lastName: "Kamsiyonna", position: "DEF", price: 50, teamName: "Marseille" },
  { firstName: "John-Orie", lastName: "Joseph", position: "DEF", price: 50, teamName: "Marseille" },
  { firstName: "Echekam", lastName: "Ezinwanne", position: "DEF", price: 50, teamName: "Marseille" },
  { firstName: "Nwaboghi", lastName: "Chigozie", position: "DEF", price: 50, teamName: "Marseille" },
  { firstName: "Ogamba", lastName: "Daniel", position: "DEF", price: 50, teamName: "Marseille" },
  { firstName: "Nick", lastName: "Kingsley", position: "DEF", price: 50, teamName: "Marseille" },
  { firstName: "Okoye", lastName: "Henry", position: "MID", price: 50, teamName: "Marseille" },
  { firstName: "Ken-Okorie", lastName: "Ifeanyichukwu", position: "MID", price: 50, teamName: "Marseille" },
  { firstName: "Sylvernus", lastName: "Emmanuel", position: "DEF", price: 50, teamName: "Marseille" },
  { firstName: "Emeonye", lastName: "Chinedu Diamond", position: "MID", price: 50, teamName: "Marseille" },
  { firstName: "Iwuoha", lastName: "Kamsi", position: "MID", price: 50, teamName: "Marseille" },
  { firstName: "Ejike-Aniele", lastName: "Noble Triumph", position: "DEF", price: 100, teamName: "Marseille" },
  { firstName: "Nnadiegbulam", lastName: "Goodluck", position: "GK", price: 50, teamName: "Marseille" },
  { firstName: "Nmerem", lastName: "Excellent", position: "DEF", price: 50, teamName: "Marseille" },
  { firstName: "Nnadozie", lastName: "Destiny", position: "DEF", price: 150, teamName: "Marseille" },
  { firstName: "Chigozie", lastName: "Ekene", position: "GK", price: 100, teamName: "Marseille" },
  { firstName: "Bassey", lastName: "Stephen Etim", position: "DEF", price: 150, teamName: "Marseille" },
  { firstName: "Okwudiri", lastName: "Solomon", position: "MID", price: 600, teamName: "Marseille" },
  { firstName: "Okoronkwo", lastName: "Akachukwu", position: "FWD", price: 600, teamName: "Marseille" },
  { firstName: "Chibuzor", lastName: "Emmanuel", position: "DEF", price: 100, teamName: "Marseille" },
  { firstName: "Iheanacho", lastName: "Praise", position: "MID", price: 150, teamName: "Marseille" },
  { firstName: "Okeke", lastName: "Donald", position: "DEF", price: 100, teamName: "Marseille" },
  { firstName: "Nnadozie", lastName: "Divine", position: "MID", price: 100, teamName: "Marseille" },
  { firstName: "Joshua", lastName: "Henry", position: "DEF", price: 100, teamName: "Marseille" },
  { firstName: "Nwankwo", lastName: "Emmanuel", position: "DEF", price: 50, teamName: "Marseille" },

  { firstName: "Nnaji", lastName: "Chisomaga", position: "FWD", price: 50, teamName: "PSG" },
  { firstName: "Sunday", lastName: "Somtochukwu", position: "FWD", price: 50, teamName: "PSG" },
  { firstName: "Chibuike", lastName: "Francis", position: "DEF", price: 50, teamName: "PSG" },
  { firstName: "Ernest", lastName: "Marshal", position: "FWD", price: 50, teamName: "PSG" },
  { firstName: "Nwabali", lastName: "Chinonso", position: "DEF", price: 50, teamName: "PSG" },
  { firstName: "Ahamefula", lastName: "Richard", position: "MID", price: 50, teamName: "PSG" },
  { firstName: "Opara", lastName: "Collins", position: "FWD", price: 50, teamName: "PSG" },
  { firstName: "Ukaonu", lastName: "Chima Felix", position: "DEF", price: 50, teamName: "PSG" },
  { firstName: "Emechebe", lastName: "Destiny", position: "MID", price: 50, teamName: "PSG" },
  { firstName: "Gabriel", lastName: "Ifeanyichukwu", position: "MID", price: 50, teamName: "PSG" },
  { firstName: "Ikennaa", lastName: "Chinonso", position: "FWD", price: 50, teamName: "PSG" },
  { firstName: "Tochi", lastName: "Chidubem", position: "DEF", price: 50, teamName: "PSG" },
  { firstName: "Uzanuru", lastName: "Chidera", position: "MID", price: 50, teamName: "PSG" },
  { firstName: "Anudu", lastName: "Michael", position: "DEF", price: 50, teamName: "PSG" },
  { firstName: "Izema", lastName: "Richard", position: "MID", price: 50, teamName: "PSG" },
  { firstName: "Chibuike", lastName: "Faithful", position: "DEF", price: 270, teamName: "PSG" },
  { firstName: "Nwobodo", lastName: "Prosper", position: "FWD", price: 50, teamName: "PSG" },
  { firstName: "Uzoatu", lastName: "Chiemere", position: "DEF", price: 260, teamName: "PSG" },
  { firstName: "Joseph", lastName: "Prosper", position: "FWD", price: 250, teamName: "PSG" },
  { firstName: "Ifejiagwa", lastName: "Ikechukwu", position: "MID", price: 300, teamName: "PSG" },
  { firstName: "Emechebe", lastName: "Divine", position: "MID", price: 240, teamName: "PSG" },
  { firstName: "Nnayerugo", lastName: "Kelechi", position: "FWD", price: 230, teamName: "PSG" },
  { firstName: "Ugwumba", lastName: "Joshua", position: "DEF", price: 220, teamName: "PSG" },
  { firstName: "Duruibe", lastName: "Kingston", position: "MID", price: 200, teamName: "PSG" },
  { firstName: "Ibezue", lastName: "Kingsley", position: "DEF", price: 180, teamName: "PSG" },
  { firstName: "Ilona", lastName: "Princewill", position: "DEF", price: 50, teamName: "PSG" },

  { firstName: "Okonkwo", lastName: "Johnvienny", position: "MID", price: 50, teamName: "Lyon" },
  { firstName: "Godson", lastName: "Great", position: "MID", price: 50, teamName: "Lyon" },
  { firstName: "Ochuru", lastName: "Emmanuel", position: "DEF", price: 50, teamName: "Lyon" },
  { firstName: "Mba", lastName: "Miracle", position: "DEF", price: 50, teamName: "Lyon" },
  { firstName: "Ifeanyichukwu", lastName: "Destiny", position: "MID", price: 50, teamName: "Lyon" },
  { firstName: "Kelechi", lastName: "Marii", position: "MID", price: 50, teamName: "Lyon" },
  { firstName: "Duru", lastName: "Joshua", position: "DEF", price: 50, teamName: "Lyon" },
  { firstName: "Anyachukwu", lastName: "Ferdinand", position: "DEF", price: 50, teamName: "Lyon" },
  { firstName: "Orechukwu", lastName: "Onesorm", position: "DEF", price: 50, teamName: "Lyon" },
  { firstName: "Charles", lastName: "Bliss", position: "DEF", price: 50, teamName: "Lyon" },
  { firstName: "Ofoma", lastName: "David", position: "MID", price: 50, teamName: "Lyon" },
  { firstName: "Chiemezie", lastName: "David", position: "DEF", price: 50, teamName: "Lyon" },
  { firstName: "Nnaji", lastName: "Temple", position: "FWD", price: 250, teamName: "Lyon" },
  { firstName: "Onuoha", lastName: "Isaac", position: "GK", price: 300, teamName: "Lyon" },
  { firstName: "Chijioke", lastName: "Emmanuel", position: "MID", price: 50, teamName: "Lyon" },
  { firstName: "Travis", lastName: "Makea", position: "DEF", price: 50, teamName: "Lyon" },
  { firstName: "Ndimele", lastName: "Victor", position: "MID", price: 100, teamName: "Lyon" },
  { firstName: "Chikaodiri", lastName: "Godswill", position: "DEF", price: 50, teamName: "Lyon" },
  { firstName: "Uzoma", lastName: "Perfect", position: "DEF", price: 350, teamName: "Lyon" },
  { firstName: "Eke", lastName: "Emmanuel", position: "FWD", price: 500, teamName: "Lyon" },
  { firstName: "Egbe", lastName: "Jeremy", position: "MID", price: 100, teamName: "Lyon" },
  { firstName: "Agha", lastName: "Somtochukwu", position: "MID", price: 100, teamName: "Lyon" },
  { firstName: "Dike", lastName: "Eke", position: "DEF", price: 50, teamName: "Lyon" },
  { firstName: "Ifeanyichukwu", lastName: "Nnamdi", position: "DEF", price: 250, teamName: "Lyon" },
  { firstName: "Ernest", lastName: "Kelvin", position: "FWD", price: 150, teamName: "Lyon" },
  { firstName: "Emmanuel", lastName: "Victor", position: "MID", price: 50, teamName: "Lyon" },

  { firstName: "Nwanna", lastName: "Munachi", position: "DEF", price: 100, teamName: "Monaco" },
  { firstName: "Ibezue", lastName: "Chinedu", position: "DEF", price: 300, teamName: "Monaco" },
  { firstName: "Ibe", lastName: "Emmanuel", position: "DEF", price: 200, teamName: "Monaco" },
  { firstName: "Ndubuisi", lastName: "Emmanuel", position: "DEF", price: 100, teamName: "Monaco" },
  { firstName: "Okezie", lastName: "David", position: "DEF", price: 100, teamName: "Monaco" },
  { firstName: "Emmanuel", lastName: "Goodluck", position: "DEF", price: 50, teamName: "Monaco" },
  { firstName: "Nkuma-Udah", lastName: "Kenneth", position: "DEF", price: 200, teamName: "Monaco" },
  { firstName: "Onyema", lastName: "Chibueze", position: "DEF", price: 100, teamName: "Monaco" },
  { firstName: "Okeakpu", lastName: "Olisaemeka", position: "MID", price: 50, teamName: "Monaco" },
  { firstName: "Okonkwo", lastName: "Justin", position: "MID", price: 50, teamName: "Monaco" },
  { firstName: "Nnona", lastName: "Peter", position: "MID", price: 50, teamName: "Monaco" },
  { firstName: "Eze", lastName: "Enyinnaya Wisdom", position: "MID", price: 50, teamName: "Monaco" },
  { firstName: "Asiegbu", lastName: "Munachi", position: "MID", price: 50, teamName: "Monaco" },
  { firstName: "Ezeadichie", lastName: "Jideofa", position: "MID", price: 50, teamName: "Monaco" },
  { firstName: "Ndukwu", lastName: "McBright", position: "MID", price: 50, teamName: "Monaco" },
  { firstName: "Okeke", lastName: "Jeswill", position: "FWD", price: 50, teamName: "Monaco" },
  { firstName: "Akonye", lastName: "Bright", position: "FWD", price: 50, teamName: "Monaco" },
  { firstName: "Ezeafuegwu", lastName: "John", position: "FWD", price: 50, teamName: "Monaco" },
  { firstName: "Friday", lastName: "Otuekong", position: "FWD", price: 50, teamName: "Monaco" },
  { firstName: "Echekam", lastName: "Kamsiyochi", position: "FWD", price: 50, teamName: "Monaco" },
  { firstName: "Ayogwokai", lastName: "Oshomah", position: "FWD", price: 50, teamName: "Monaco" },
  { firstName: "Enu", lastName: "Ezeugo", position: "FWD", price: 200, teamName: "Monaco" },
  { firstName: "Iheanyichi", lastName: "Eminence", position: "FWD", price: 50, teamName: "Monaco" },
  { firstName: "Okonkwo", lastName: "Gerald", position: "FWD", price: 100, teamName: "Monaco" },
  { firstName: "Kalu", lastName: "Jules", position: "FWD", price: 200, teamName: "Monaco" },
  { firstName: "Nwosu", lastName: "Obinna", position: "FWD", price: 150, teamName: "Monaco" },
  { firstName: "Alokalam", lastName: "David", position: "FWD", price: 100, teamName: "Monaco" },
  { firstName: "Isaac", lastName: "GodsWill", position: "FWD", price: 50, teamName: "Monaco" },
  { firstName: "Alex", lastName: "Chinedu", position: "FWD", price: 200, teamName: "Monaco" },
  { firstName: "Egbe", lastName: "Bethel", position: "GK", price: 200, teamName: "Monaco" }
];

async function main() {
  await prisma.squadPick.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.playerGameweekStat.deleteMany();
  await prisma.schoolPlayer.deleteMany();

  for (const p of players) {
    await prisma.schoolPlayer.create({ data: p });
  }

  const adminHash = await bcrypt.hash("Admin12345", 10);
  await prisma.user.upsert({
    where: { email: "coordinator@school.local" },
    update: { passwordHash: adminHash, role: Role.ADMIN },
    create: { email: "coordinator@school.local", name: "Sports Coordinator", passwordHash: adminHash, role: Role.ADMIN }
  });

  console.log("Seeded " + players.length + " school players");
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
