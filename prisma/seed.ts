import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed sample PA-specific articles
  const articles = [
    {
      title: "Philadelphia School District Proposes New Funding Model",
      whoShouldCare: "PA parents, educators, taxpayers",
      summary:
        "The Philadelphia School District has unveiled a proposal to redistribute funding across schools based on student needs rather than enrollment numbers alone.",
      impact: "Could shift millions in resources to underserved schools.",
      sourceName: "Philadelphia Inquirer",
      category: "Education",
      region: "Philadelphia",
    },
    {
      title: "Pittsburgh Announces Clean Energy Initiative",
      whoShouldCare: "Pittsburgh residents, environmental advocates",
      summary:
        "Pittsburgh city council approved a plan to transition municipal buildings to 100% renewable energy by 2030, with incentives for private buildings.",
      impact: "May reduce city carbon emissions by 40% and create 500+ jobs.",
      sourceName: "Pittsburgh Post-Gazette",
      category: "Environment",
      region: "Pittsburgh",
    },
    {
      title: "PA Legislature Debates Voter ID Requirements",
      whoShouldCare: "All PA voters",
      summary:
        "State lawmakers are considering changes to voter identification requirements that would affect how Pennsylvanians verify their identity at polling places.",
      impact: "Could affect voting access for thousands of PA residents.",
      sourceName: "PA Capitol Bureau",
      category: "Elections",
      region: "Statewide",
    },
    {
      title: "Rural Healthcare Access Bill Advances in Harrisburg",
      whoShouldCare: "Rural PA residents, healthcare workers",
      summary:
        "A bipartisan bill to expand telemedicine coverage and fund rural clinics passed committee vote, moving to the full Senate.",
      impact: "Would bring healthcare services to 30+ underserved counties.",
      sourceName: "Harrisburg Patriot-News",
      category: "Healthcare",
      region: "Statewide",
    },
    {
      title: "SEPTA Fare Increase Proposal Under Review",
      whoShouldCare: "Philadelphia metro commuters",
      summary:
        "SEPTA board is reviewing a proposed 5% fare increase to address budget shortfalls, with public comment period now open.",
      impact: "Monthly pass prices could rise by $10-15 if approved.",
      sourceName: "WHYY",
      category: "Transportation",
      region: "Philadelphia",
    },
  ];

  for (const article of articles) {
    await prisma.article.create({
      data: article,
    });
  }

  console.log("Seeded", articles.length, "articles");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
