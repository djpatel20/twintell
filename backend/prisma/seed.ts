import { PrismaClient, Role, PostTopic, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Categories
  const categoriesData = [
    { name: 'Textiles & Clothing', slug: 'textiles-clothing', icon: 'Shirt' },
    { name: 'Electronics & Electrical', slug: 'electronics-electrical', icon: 'Cpu' },
    { name: 'Machinery & Equipment', slug: 'machinery-equipment', icon: 'Cog' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', icon: 'Home' },
    { name: 'Chemicals', slug: 'chemicals', icon: 'FlaskConical' },
    { name: 'Food & Beverages', slug: 'food-beverages', icon: 'Utensils' },
    { name: 'Packaging', slug: 'packaging', icon: 'Package' },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const upserted = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon },
      create: cat,
    });
    categories[cat.slug] = upserted.id;
  }
  console.log('✅ Categories seeded');

  // 2. Seed Plans
  const plansData = [
    {
      code: 'FREE',
      name: 'Free Plan',
      priceMonthly: 0,
      postsPerMonth: null, // null = unlimited for Phase 1
      productsLimit: null,
      isActive: true,
    },
    {
      code: 'PRO',
      name: 'Pro Business',
      priceMonthly: 999,
      postsPerMonth: 100,
      productsLimit: 50,
      isActive: true,
    },
    {
      code: 'ENTERPRISE',
      name: 'Enterprise Scale',
      priceMonthly: 4999,
      postsPerMonth: null,
      productsLimit: null,
      isActive: true,
    },
  ];

  const plans: Record<string, string> = {};
  for (const plan of plansData) {
    const upserted = await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        postsPerMonth: plan.postsPerMonth,
        productsLimit: plan.productsLimit,
        isActive: plan.isActive,
      },
      create: plan,
    });
    plans[plan.code] = upserted.id;
  }
  console.log('✅ Plans seeded');

  // 3. Seed Users & Companies (Matching mockups)
  const sampleUsers = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'contact@greenpack.com',
      name: 'Keyur Patel',
      headline: 'Business Networker | Founder',
      bio: 'Connecting businesses. Building opportunities. Let us grow together.',
      city: 'Ahmedabad, Gujarat',
      role: Role.COMPANY,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      company: {
        name: 'GreenPack Solutions',
        slug: 'greenpack-solutions',
        logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        businessType: 'Manufacturer',
        categorySlug: 'packaging',
        city: 'Ahmedabad',
        state: 'Gujarat',
        description: 'We are a leading manufacturer of premium packaging solutions for food, cosmetics, and D2C brands. We offer custom designs, eco-friendly materials and bulk supply.',
        tags: ['Packaging', 'Custom Boxes', 'Eco Friendly'],
        yearFounded: 2016,
        verified: true,
        followerCount: 12400,
      },
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'sales@sunrisepackaging.in',
      name: 'Rajesh Sharma',
      headline: 'Operations Director at Sunrise Packaging',
      bio: 'Leading eco-friendly packaging revolutions across western India.',
      city: 'Surat, Gujarat',
      role: Role.COMPANY,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      company: {
        name: 'Sunrise Packaging Pvt. Ltd.',
        slug: 'sunrise-packaging',
        logoUrl: 'https://images.unsplash.com/photo-1516876437184-593fda40c7ce?auto=format&fit=crop&w=200&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
        businessType: 'Manufacturer',
        categorySlug: 'packaging',
        city: 'Surat',
        state: 'Gujarat',
        description: 'Specialized in automated corrugated packaging, heavy duty cartons, and sustainable paper solutions.',
        tags: ['Packaging', 'Custom Boxes', 'Corrugated'],
        yearFounded: 2018,
        verified: true,
        followerCount: 8700,
      },
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'team@techspark.io',
      name: 'Amit Verma',
      headline: 'Product Head at TechSpark Solutions',
      bio: 'Building reliable electronics and hardware sensors for smart manufacturing.',
      city: 'Vadodara, Gujarat',
      role: Role.COMPANY,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      company: {
        name: 'TechSpark Solutions',
        slug: 'techspark-solutions',
        logoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        businessType: 'Supplier',
        categorySlug: 'electronics-electrical',
        city: 'Vadodara',
        state: 'Gujarat',
        description: 'Industrial IoT components, power supplies, microcontroller boards, and custom electronics wholesale.',
        tags: ['Electronics', 'Sensors', 'Wholesale'],
        yearFounded: 2020,
        verified: false,
        followerCount: 3200,
      },
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'buyer@twintell.demo',
      name: 'Riya Sharma',
      headline: 'Procurement Specialist',
      bio: 'Sourcing industrial packaging and sustainable goods for D2C brands.',
      city: 'Mumbai, Maharashtra',
      role: Role.USER,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      company: null,
    },
  ];

  for (const item of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { id: item.id },
      update: {
        email: item.email,
        name: item.name,
        avatarUrl: item.avatarUrl,
        headline: item.headline,
        bio: item.bio,
        city: item.city,
        role: item.role,
      },
      create: {
        id: item.id,
        email: item.email,
        name: item.name,
        avatarUrl: item.avatarUrl,
        headline: item.headline,
        bio: item.bio,
        city: item.city,
        role: item.role,
      },
    });

    if (item.company) {
      const companyData = item.company;
      const categoryId = categories[companyData.categorySlug] || null;

      const company = await prisma.company.upsert({
        where: { userId: user.id },
        update: {
          name: companyData.name,
          slug: companyData.slug,
          logoUrl: companyData.logoUrl,
          coverUrl: companyData.coverUrl,
          businessType: companyData.businessType,
          categoryId,
          city: companyData.city,
          state: companyData.state,
          description: companyData.description,
          tags: companyData.tags,
          yearFounded: companyData.yearFounded,
          verified: companyData.verified,
          followerCount: companyData.followerCount,
        },
        create: {
          userId: user.id,
          name: companyData.name,
          slug: companyData.slug,
          logoUrl: companyData.logoUrl,
          coverUrl: companyData.coverUrl,
          businessType: companyData.businessType,
          categoryId,
          city: companyData.city,
          state: companyData.state,
          description: companyData.description,
          tags: companyData.tags,
          yearFounded: companyData.yearFounded,
          verified: companyData.verified,
          followerCount: companyData.followerCount,
        },
      });

      // Free subscription for company
      await prisma.subscription.upsert({
        where: { companyId: company.id },
        update: {},
        create: {
          companyId: company.id,
          planId: plans['FREE'],
          status: SubscriptionStatus.ACTIVE,
        },
      });

      // Seed sample Products for GreenPack Solutions
      if (company.slug === 'greenpack-solutions') {
        const existingProducts = await prisma.product.count({ where: { companyId: company.id } });
        if (existingProducts === 0) {
          await prisma.product.create({
            data: {
              companyId: company.id,
              categoryId,
              title: 'Custom Printed Corrugated Boxes',
              description: 'Eco-friendly 3-ply and 5-ply corrugated mailer boxes with high-resolution offset and digital printing. Ideal for D2C e-commerce brands, cosmetics, and luxury apparel.',
              price: 12.0,
              priceUnit: 'piece',
              moq: 1000,
              images: [
                'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
              ],
              tags: ['Eco Friendly', 'Custom Printing', 'Bulk Order'],
              material: 'Corrugated Board (Kraft)',
              sizes: 'Custom Sizes Available',
              usage: 'Food, Cosmetics, E-commerce',
            },
          });

          await prisma.product.create({
            data: {
              companyId: company.id,
              categoryId,
              title: 'Biodegradable Stand Up Pouches',
              description: 'Multi-layer barrier pouches with resealable zip lock. Completely compostable kraft surface with PLA lining.',
              price: 6.5,
              priceUnit: 'piece',
              moq: 2000,
              images: [
                'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
              ],
              tags: ['Compostable', 'Food Grade', 'Zip Lock'],
              material: 'Kraft Paper + PLA',
              sizes: '250g, 500g, 1kg',
              usage: 'Dry Fruits, Coffee, Tea, Organic Food',
            },
          });
        }

        // Seed sample Posts
        const existingPosts = await prisma.post.count({ where: { companyId: company.id } });
        if (existingPosts === 0) {
          await prisma.post.create({
            data: {
              companyId: company.id,
              content: 'We are excited to announce our new sustainable packaging solutions for D2C brands. Eco-friendly, customizable and premium quality.\n\n#SustainablePackaging #D2C #Manufacturing',
              images: [
                'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
              ],
              topic: PostTopic.MANUFACTURING,
              likeCount: 128,
              commentCount: 24,
            },
          });
        }
      }

      // Seed post for Sunrise Packaging
      if (company.slug === 'sunrise-packaging') {
        const existingPosts = await prisma.post.count({ where: { companyId: company.id } });
        if (existingPosts === 0) {
          await prisma.post.create({
            data: {
              companyId: company.id,
              content: 'Upgraded our production facility in Surat with modern German die-cutting machinery. Our throughput is up by 40% with zero defect assurance!',
              images: [],
              topic: PostTopic.BUSINESS_NEWS,
              likeCount: 84,
              commentCount: 9,
            },
          });
        }
      }
    }
  }

  console.log('✅ Sample users, companies, products and posts seeded');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
