import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for seeding.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const categories = [
  ["Product Quality", "Quality, reliability, and condition of the product."],
  ["Customer Service", "Staff helpfulness, communication, and support."],
  ["Delivery", "Speed, accuracy, and condition on arrival."],
  ["Value for Money", "Price, value, and overall worth."],
  ["Website Experience", "Navigation, checkout, and usability."],
] as const;

const comments = [
  "The staff handled my request quickly and clearly.",
  "Checkout was easy, but delivery took longer than expected.",
  "The product quality was better than I expected.",
  "I had to contact support twice before the issue was resolved.",
  "Everything worked well. I would use the service again.",
  "The instructions were not clear enough for a first-time customer.",
  "Good value and a smooth experience overall.",
  "The order arrived damaged and needs follow-up.",
  "The website was simple to use on my phone.",
  null,
];

async function main() {
  const production = process.env.NODE_ENV === "production";
  if (production && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error(
      "Demo seeding is disabled in production. Set ALLOW_DEMO_SEED=true only for an intentional disposable demo.",
    );
  }

  const email = (process.env.DEMO_ADMIN_EMAIL ?? "owner@example.com").toLowerCase();
  const password =
    process.env.DEMO_ADMIN_PASSWORD ??
    (production ? undefined : "ChangeMe123!");
  if (!password) {
    throw new Error("DEMO_ADMIN_PASSWORD is required for production demo seeding.");
  }
  const passwordHash = await hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: "Demo Owner", passwordHash, isDisabled: false, deletedAt: null },
    create: { email, name: "Demo Owner", passwordHash },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "sample-business" },
    update: { name: "Sample Business", timeZone: "Asia/Manila", deletedAt: null },
    create: { name: "Sample Business", slug: "sample-business", timeZone: "Asia/Manila" },
  });

  await prisma.organizationMembership.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
    update: { role: "OWNER", revokedAt: null },
    create: { organizationId: organization.id, userId: user.id, role: "OWNER" },
  });

  const form = await prisma.feedbackForm.upsert({
    where: { publicSlug: "sample-business-feedback" },
    update: {
      organizationId: organization.id,
      createdByUserId: user.id,
      title: "How was your experience?",
      description: "Your feedback helps us improve our products and service.",
      successMessage: "Thank you. Your feedback has been shared with our team.",
      status: "ACTIVE",
      deletedAt: null,
    },
    create: {
      organizationId: organization.id,
      createdByUserId: user.id,
      name: "Primary Feedback Form",
      publicSlug: "sample-business-feedback",
      title: "How was your experience?",
      description: "Your feedback helps us improve our products and service.",
      successMessage: "Thank you. Your feedback has been shared with our team.",
      status: "ACTIVE",
    },
  });

  const createdCategories = [];
  for (const [index, [name, description]] of categories.entries()) {
    const category = await prisma.feedbackCategory.upsert({
      where: {
        organizationId_normalizedName: {
          organizationId: organization.id,
          normalizedName: name.toLowerCase(),
        },
      },
      update: { name, description, displayOrder: index, isActive: true, archivedAt: null },
      create: {
        organizationId: organization.id,
        createdByUserId: user.id,
        name,
        normalizedName: name.toLowerCase(),
        description,
        displayOrder: index,
      },
    });
    createdCategories.push(category);
    await prisma.formCategoryAssignment.upsert({
      where: { formId_categoryId: { formId: form.id, categoryId: category.id } },
      update: { displayOrder: index, organizationId: organization.id },
      create: {
        organizationId: organization.id,
        formId: form.id,
        categoryId: category.id,
        displayOrder: index,
      },
    });
  }

  const existingCount = await prisma.feedbackSubmission.count({
    where: { organizationId: organization.id },
  });

  if (existingCount < 120) {
    const now = Date.now();
    for (let index = existingCount; index < 160; index += 1) {
      const category = createdCategories[index % createdCategories.length];
      if (!category) throw new Error("Seed categories were not created.");
      const ratingPattern = [5, 4, 4, 3, 5, 2, 4, 1, 5, 3];
      const rating = ratingPattern[index % ratingPattern.length] ?? 4;
      const submittedAt = new Date(now - index * 12 * 60 * 60 * 1000);
      const status = index % 17 === 0 ? "FLAGGED" : index % 23 === 0 ? "SPAM" : index % 4 === 0 ? "REVIEWED" : "NEW";
      const priority = rating <= 2 ? "HIGH" : rating === 3 ? "NORMAL" : "LOW";

      await prisma.feedbackSubmission.create({
        data: {
          organizationId: organization.id,
          formId: form.id,
          categoryId: category.id,
          rating,
          comment: comments[index % comments.length] ?? null,
          status,
          priority,
          workflowStatus: index % 9 === 0 ? "RESOLVED" : index % 5 === 0 ? "INVESTIGATING" : "OPEN",
          requestId: crypto.randomUUID(),
          submittedAt,
          resolvedAt: index % 9 === 0 ? new Date(submittedAt.getTime() + 24 * 60 * 60 * 1000) : null,
        },
      });
    }
  }

  console.log(`Seeded local demo account ${email}.`);
  console.log("Public form: http://localhost:3000/f/sample-business-feedback");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
