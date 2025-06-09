import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST() {
  try {
    console.log("Starting seed data creation...");

    // מחיקת נתונים קיימים (אופציונלי)
    await prisma.orderPhase.deleteMany();
    await prisma.orderCategory.deleteMany();
    await prisma.supplierCategory.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customsAgent.deleteMany();
    await prisma.customsCompany.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.productCategory.deleteMany();
    await prisma.orderStageTemplate.deleteMany(); // הוסף את זה

    console.log("Old data cleared...");

    // 0. יצירת תבניות שלבים קבועים (חדש!)
    const stageTemplates = [
      {
        name: "הכנת הזמנה",
        durationDays: 2,
        order: 1,
        isConditional: false,
        condition: null,
        isDynamic: false,
        calculationMethod: null,
        isActive: true,
        description: "הכנת ההזמנה, בירור פרטים, הכנת מסמכים",
      },
      {
        name: "שליחת הזמנה לספק",
        durationDays: 7,
        order: 2,
        isConditional: false,
        condition: null,
        isDynamic: false,
        calculationMethod: null,
        isActive: true,
        description: "שליחת ההזמנה לספק וקבלת אישור",
      },
      {
        name: "תשלום מקדמה",
        durationDays: 2,
        order: 3,
        isConditional: true,
        condition: "hasAdvancePayment",
        isDynamic: false,
        calculationMethod: null,
        isActive: true,
        description: "תשלום מקדמה לספק (רק אם נדרש)",
      },
      {
        name: "ייצור",
        durationDays: 0, // יחושב דינמית
        order: 4,
        isConditional: false,
        condition: null,
        isDynamic: true,
        calculationMethod: "productionTimeWeeks * 7",
        isActive: true,
        description: "תהליך הייצור אצל הספק - משך זמן משתנה לפי ספק",
      },
      {
        name: "המכלה",
        durationDays: 7,
        order: 5,
        isConditional: false,
        condition: null,
        isDynamic: false,
        calculationMethod: null,
        isActive: true,
        description: "אריזה וטעינה לקונטיינר",
      },
      {
        name: "שילוח",
        durationDays: 0, // יחושב דינמית
        order: 6,
        isConditional: false,
        condition: null,
        isDynamic: true,
        calculationMethod: "shippingTimeWeeks * 7",
        isActive: true,
        description: "שילוח מהספק לנמל היעד - משך זמן משתנה לפי ספק",
      },
      {
        name: "תשלום סופי",
        durationDays: 2,
        order: 7,
        isConditional: false,
        condition: null,
        isDynamic: false,
        calculationMethod: null,
        isActive: true,
        description: "תשלום יתרת הסכום לספק",
      },
      {
        name: "כניסה לנמל ושחרור",
        durationDays: 7,
        order: 8,
        isConditional: false,
        condition: null,
        isDynamic: false,
        calculationMethod: null,
        isActive: true,
        description: "טיפול מכסי ושחרור הסחורה מהנמל",
      },
    ];

    const createdTemplates = await Promise.all(
      stageTemplates.map((template) =>
        prisma.orderStageTemplate.create({ data: template })
      )
    );

    console.log("Order stage templates created:", createdTemplates.length);

    // 1. יצירת קטגוריות מוצרים
    const categories = await Promise.all([
      prisma.productCategory.create({
        data: {
          name: "מיטות וכריות",
          description:
            "מיטות נוחות, כריות אורתופדיות וזיכרון קצף לכלבים וחתולים",
        },
      }),
      prisma.productCategory.create({
        data: {
          name: "צעצועים אינטראקטיביים",
          description: "צעצועי חכמה, כדורים מנגנים ופאזלים לעידוד פעילות",
        },
      }),
      prisma.productCategory.create({
        data: {
          name: "קולרים ורצועות",
          description: "קולרים עם GPS, רצועות נשלפות ואקססוריז הליכה",
        },
      }),
      prisma.productCategory.create({
        data: {
          name: "קערות ומתקני האכלה",
          description: "קערות נירוסטה, מתקנים אוטומטיים ובקבוקי מים",
        },
      }),
      prisma.productCategory.create({
        data: {
          name: "מזון יבש ולח",
          description: "מזון פרימיום, דיאטטי וטיפולי לכלבים וחתולים",
        },
      }),
      prisma.productCategory.create({
        data: {
          name: "חטיפים ועצמות",
          description: "חטיפי אימון, עצמות לנשיכה ופינוקים בריאים",
        },
      }),
    ]);

    console.log("Categories created:", categories.length);

    // 2. יצירת עמילויות מכס
    const customsCompanies = await Promise.all([
      prisma.customsCompany.create({
        data: {
          name: "עמילות הנמל הירוק",
          address: "רח׳ הנמל 15, חיפה, ישראל",
          phone: "04-8234567",
          email: "office@greenport.co.il",
        },
      }),
      prisma.customsCompany.create({
        data: {
          name: "מכס פלוס בע״מ",
          address: "שד׳ בן גוריון 45, תל אביב, ישראל",
          phone: "03-5567890",
          email: "info@customsplus.co.il",
        },
      }),
      prisma.customsCompany.create({
        data: {
          name: "ישראל עמילות בינלאומית",
          address: "רח׳ התעשייה 23, אשדוד, ישראל",
          phone: "08-9123456",
          email: "service@israelcustoms.com",
        },
      }),
    ]);

    console.log("Customs companies created:", customsCompanies.length);

    // 3. יצירת עמילי מכס
    const customsAgents = await Promise.all([
      prisma.customsAgent.create({
        data: {
          customsCompanyId: customsCompanies[0].id,
          name: "משה כהן",
          phone: "050-1234567",
          position: "מנהל עמילות בכיר",
        },
      }),
      prisma.customsAgent.create({
        data: {
          customsCompanyId: customsCompanies[0].id,
          name: "רחל לוי",
          phone: "052-9876543",
          position: "רכזת יבוא",
        },
      }),
      prisma.customsAgent.create({
        data: {
          customsCompanyId: customsCompanies[1].id,
          name: "דוד אברהם",
          phone: "054-5678901",
          position: "מנהל מחלקת חיות מחמד",
        },
      }),
      prisma.customsAgent.create({
        data: {
          customsCompanyId: customsCompanies[2].id,
          name: "יוסי חיים",
          phone: "058-8765432",
          position: "מומחה יבוא מזון לחיות",
        },
      }),
    ]);

    console.log("Customs agents created:", customsAgents.length);

    // 4. יצירת ספקים
    const suppliers = await Promise.all([
      prisma.supplier.create({
        data: {
          name: "PetWorld Industries Co. Ltd",
          country: "China",
          city: "Guangzhou",
          address: "1288 Huangpu East Road, Tianhe District",
          phone: "+86-20-8765-4321",
          email: "international@petworld-gd.com",
          contactPerson: "Lisa Wang",
          contactPhone: "+86-138-0013-7788",
          contactPosition: "Export Sales Manager",
          productionTimeWeeks: 4,
          shippingTimeWeeks: 3,
          paymentTerms: "30% מקדמה, 70% לפני משלוח",
          hasAdvancePayment: true,
          advancePercentage: 30,
          currency: "USD",
          importLicense: "CN-IMP-2024-PET-001",
          licenseExpiry: new Date("2025-12-31"),
          bankName: "Bank of China, Guangzhou Branch",
          beneficiary: "PetWorld Industries Co. Ltd",
          iban: "CN12BOCN2024000123456789",
          bic: "BKCHCNBJ440",
        },
      }),
      prisma.supplier.create({
        data: {
          name: "Euro Pet Products GmbH",
          country: "Germany",
          city: "Hamburg",
          address: "Hafenstraße 42, 20359 Hamburg",
          phone: "+49-40-123-456-78",
          email: "export@europet.de",
          contactPerson: "Klaus Müller",
          contactPhone: "+49-176-987-654-32",
          contactPosition: "International Sales Director",
          productionTimeWeeks: 2,
          shippingTimeWeeks: 2,
          paymentTerms: "תשלום מלא לפני משלוח",
          hasAdvancePayment: false,
          currency: "EUR",
          importLicense: "DE-EXP-2024-TIER-007",
          licenseExpiry: new Date("2026-03-15"),
          bankName: "Deutsche Bank AG, Hamburg",
          beneficiary: "Euro Pet Products GmbH",
          iban: "DE89370400440532013000",
          bic: "COBADEFFXXX",
        },
      }),
      prisma.supplier.create({
        data: {
          name: "Premium Pet Solutions Ltd",
          country: "United Kingdom",
          city: "Manchester",
          address: "85 Industrial Park Road, Manchester M15 4PS",
          phone: "+44-161-234-5678",
          email: "orders@premiumpetsolutions.co.uk",
          contactPerson: "James Robertson",
          contactPhone: "+44-7700-123456",
          contactPosition: "Head of Global Sales",
          productionTimeWeeks: 3,
          shippingTimeWeeks: 2,
          paymentTerms: "50% מקדמה, 50% לפני משלוח",
          hasAdvancePayment: true,
          advancePercentage: 50,
          currency: "USD",
          importLicense: "UK-PET-EXP-2024-789",
          licenseExpiry: new Date("2025-11-20"),
          bankName: "Barclays Bank UK PLC",
          beneficiary: "Premium Pet Solutions Ltd",
          iban: "GB29NWBK60161331926819",
          bic: "NWBKGB2L",
        },
      }),
      prisma.supplier.create({
        data: {
          name: "Istanbul Pet Manufacturing",
          country: "Turkey",
          city: "Istanbul",
          address: "Sanayi Mahallesi, Organize Sanayi Bölgesi 3. Cadde No:17",
          phone: "+90-212-567-8901",
          email: "export@istanbulpet.com.tr",
          contactPerson: "Mehmet Özkan",
          contactPhone: "+90-532-123-4567",
          contactPosition: "Export Operations Manager",
          productionTimeWeeks: 3,
          shippingTimeWeeks: 1,
          paymentTerms: "40% מקדמה, יתרה בתוך 60 יום",
          hasAdvancePayment: true,
          advancePercentage: 40,
          currency: "USD",
          importLicense: "TR-PET-2024-IST-456",
          licenseExpiry: new Date("2025-09-10"),
          bankName: "Türkiye İş Bankası A.Ş.",
          beneficiary: "Istanbul Pet Manufacturing Ltd. Şti.",
          iban: "TR330006100519786457841326",
          bic: "ISBKTRIS",
        },
      }),
    ]);

    console.log("Suppliers created:", suppliers.length);

    // 5. קישור ספקים לקטגוריות
    await Promise.all([
      // PetWorld - מיטות, צעצועים, קולרים
      prisma.supplierCategory.create({
        data: { supplierId: suppliers[0].id, categoryId: categories[0].id },
      }),
      prisma.supplierCategory.create({
        data: { supplierId: suppliers[0].id, categoryId: categories[1].id },
      }),
      prisma.supplierCategory.create({
        data: { supplierId: suppliers[0].id, categoryId: categories[2].id },
      }),
      // Euro Pet - קערות, מזון, חטיפים
      prisma.supplierCategory.create({
        data: { supplierId: suppliers[1].id, categoryId: categories[3].id },
      }),
      prisma.supplierCategory.create({
        data: { supplierId: suppliers[1].id, categoryId: categories[4].id },
      }),
      prisma.supplierCategory.create({
        data: { supplierId: suppliers[1].id, categoryId: categories[5].id },
      }),
      // Premium Pet - מיטות, חטיפים
      prisma.supplierCategory.create({
        data: { supplierId: suppliers[2].id, categoryId: categories[0].id },
      }),
      prisma.supplierCategory.create({
        data: { supplierId: suppliers[2].id, categoryId: categories[5].id },
      }),
      // Istanbul Pet - צעצועים, קולרים, קערות
      prisma.supplierCategory.create({
        data: { supplierId: suppliers[3].id, categoryId: categories[1].id },
      }),
      prisma.supplierCategory.create({
        data: { supplierId: suppliers[3].id, categoryId: categories[2].id },
      }),
    ]);

    console.log("Supplier categories linked...");

    // 6. יצירת הזמנות מפורטות
    const orders = [];

    // הזמנה 1 - PetWorld
    const order1 = await prisma.order.create({
      data: {
        orderNumber: "ORD-2025-001",
        supplierId: suppliers[0].id,
        etaFinal: new Date("2025-08-15"),
        status: "בייצור",
        totalAmount: new Decimal(45000),
        advanceAmount: new Decimal(13500), // 30%
        finalPaymentAmount: new Decimal(31500),
        exchangeRate: new Decimal(3.65),
        containerNumber: "MSCU1234567",
        customsCompanyId: customsCompanies[0].id,
        customsAgentId: customsAgents[0].id,
        notes:
          "הזמנה דחופה לעונת הקיץ - מיטות וצעצועים פרימיום. דרושה הכנה מיוחדת לאריזה בקרטונים קטנים.",
        portReleaseCost: new Decimal(3200),
        calculatedEta: new Date("2025-08-12"),
      },
    });

    // הזמנה 2 - Euro Pet
    const order2 = await prisma.order.create({
      data: {
        orderNumber: "ORD-2025-002",
        supplierId: suppliers[1].id,
        etaFinal: new Date("2025-07-20"),
        status: "נשלח",
        totalAmount: new Decimal(28000),
        finalPaymentAmount: new Decimal(28000),
        exchangeRate: new Decimal(4.02),
        containerNumber: "TEMU9876543",
        customsCompanyId: customsCompanies[1].id,
        customsAgentId: customsAgents[2].id,
        notes: "מזון אורגני פרימיום מגרמניה. דרוש אישור וטרינרי מיוחד.",
        portReleaseCost: new Decimal(2800),
        calculatedEta: new Date("2025-07-18"),
      },
    });

    // הזמנה 3 - Premium Pet
    const order3 = await prisma.order.create({
      data: {
        orderNumber: "ORD-2025-003",
        supplierId: suppliers[2].id,
        etaFinal: new Date("2025-09-10"),
        status: "בתהליך הזמנה",
        totalAmount: new Decimal(62000),
        advanceAmount: new Decimal(31000), // 50%
        finalPaymentAmount: new Decimal(31000),
        exchangeRate: new Decimal(3.65),
        customsCompanyId: customsCompanies[2].id,
        customsAgentId: customsAgents[3].id,
        notes: "קולקציית חורף 2025 - מיטות פרימיום וחטיפים מיוחדים.",
        portReleaseCost: new Decimal(4100),
      },
    });

    // הזמנה 4 - Istanbul Pet
    const order4 = await prisma.order.create({
      data: {
        orderNumber: "ORD-2025-004",
        supplierId: suppliers[3].id,
        etaFinal: new Date("2025-06-30"),
        status: "הגיע לנמל",
        totalAmount: new Decimal(33500),
        advanceAmount: new Decimal(13400), // 40%
        finalPaymentAmount: new Decimal(20100),
        exchangeRate: new Decimal(3.65),
        containerNumber: "COSCO567891",
        customsCompanyId: customsCompanies[0].id,
        customsAgentId: customsAgents[1].id,
        notes:
          "צעצועים חכמים ואינטראקטיביים. מוצרים עם בטריות - דרושה הצהרת בטיחות.",
        portReleaseCost: new Decimal(2900),
        calculatedEta: new Date("2025-06-28"),
      },
    });

    // הזמנה 5 - הושלמה
    const order5 = await prisma.order.create({
      data: {
        orderNumber: "ORD-2025-005",
        supplierId: suppliers[1].id,
        etaFinal: new Date("2025-05-15"),
        status: "הושלם",
        totalAmount: new Decimal(41000),
        finalPaymentAmount: new Decimal(41000),
        exchangeRate: new Decimal(4.02),
        containerNumber: "MAERSK123456",
        customsCompanyId: customsCompanies[1].id,
        customsAgentId: customsAgents[2].id,
        notes: "מזון אורגני סקנדינבי. הגיע בזמן, איכות מעולה!",
        portReleaseCost: new Decimal(3600),
        calculatedEta: new Date("2025-05-13"),
      },
    });

    orders.push(order1, order2, order3, order4, order5);

    console.log("Orders created:", orders.length);

    // 7. הוספת קטגוריות להזמנות
    await Promise.all([
      // הזמנה 1 - מיטות וצעצועים
      prisma.orderCategory.create({
        data: {
          orderId: order1.id,
          categoryId: categories[0].id,
          quantity: 150,
        },
      }),
      prisma.orderCategory.create({
        data: {
          orderId: order1.id,
          categoryId: categories[1].id,
          quantity: 200,
        },
      }),
      // הזמנה 2 - מזון וחטיפים
      prisma.orderCategory.create({
        data: {
          orderId: order2.id,
          categoryId: categories[4].id,
          quantity: 500,
        },
      }),
      prisma.orderCategory.create({
        data: {
          orderId: order2.id,
          categoryId: categories[5].id,
          quantity: 300,
        },
      }),
      // הזמנה 3 - מיטות וחטיפים
      prisma.orderCategory.create({
        data: {
          orderId: order3.id,
          categoryId: categories[0].id,
          quantity: 100,
        },
      }),
      prisma.orderCategory.create({
        data: {
          orderId: order3.id,
          categoryId: categories[5].id,
          quantity: 200,
        },
      }),
    ]);

    console.log("Order categories linked...");

    // 8. יצירת שלבים להזמנות קיימות (חדש!)
    console.log("Creating order phases...");

    for (const order of orders) {
      const supplier = suppliers.find((s) => s.id === order.supplierId);
      if (!supplier) continue;

      // חישוב שלבים לאחור מ-ETA
      let currentDate = new Date(order.etaFinal);
      const orderPhases = [];

      // שלב 8: כניסה לנמל ושחרור (7 ימים)
      const phase8End = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - 7);
      orderPhases.unshift({
        orderId: order.id,
        phaseName: "כניסה לנמל ושחרור",
        startDate: new Date(currentDate),
        endDate: phase8End,
        durationDays: 7,
        phaseOrder: 8,
      });

      // שלב 7: תשלום סופי (2 ימים)
      const phase7End = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - 2);
      orderPhases.unshift({
        orderId: order.id,
        phaseName: "תשלום סופי",
        startDate: new Date(currentDate),
        endDate: phase7End,
        durationDays: 2,
        phaseOrder: 7,
      });

      // שלב 6: שילוח (לפי ספק)
      const shippingDays = supplier.shippingTimeWeeks * 7;
      const phase6End = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - shippingDays);
      orderPhases.unshift({
        orderId: order.id,
        phaseName: "שילוח",
        startDate: new Date(currentDate),
        endDate: phase6End,
        durationDays: shippingDays,
        phaseOrder: 6,
      });

      // שלב 5: המכלה (7 ימים)
      const phase5End = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - 7);
      orderPhases.unshift({
        orderId: order.id,
        phaseName: "המכלה",
        startDate: new Date(currentDate),
        endDate: phase5End,
        durationDays: 7,
        phaseOrder: 5,
      });

      // שלב 4: ייצור (לפי ספק)
      const productionDays = supplier.productionTimeWeeks * 7;
      const phase4End = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - productionDays);
      orderPhases.unshift({
        orderId: order.id,
        phaseName: "ייצור",
        startDate: new Date(currentDate),
        endDate: phase4End,
        durationDays: productionDays,
        phaseOrder: 4,
      });

      // שלב 3: תשלום מקדמה (אם יש)
      if (supplier.hasAdvancePayment) {
        const phase3End = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() - 2);
        orderPhases.unshift({
          orderId: order.id,
          phaseName: "תשלום מקדמה",
          startDate: new Date(currentDate),
          endDate: phase3End,
          durationDays: 2,
          phaseOrder: 3,
        });
      }

      // שלב 2: שליחת הזמנה לספק (7 ימים)
      const phase2End = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - 7);
      orderPhases.unshift({
        orderId: order.id,
        phaseName: "שליחת הזמנה לספק",
        startDate: new Date(currentDate),
        endDate: phase2End,
        durationDays: 7,
        phaseOrder: 2,
      });

      // שלב 1: הכנת הזמנה (2 ימים)
      const phase1End = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - 2);
      orderPhases.unshift({
        orderId: order.id,
        phaseName: "הכנת הזמנה",
        startDate: new Date(currentDate),
        endDate: phase1End,
        durationDays: 2,
        phaseOrder: 1,
      });

      // יצירת השלבים בדאטבייס
      await prisma.orderPhase.createMany({
        data: orderPhases,
      });
    }

    console.log("Order phases created for all orders...");
    console.log("✅ All sample data created successfully!");

    return NextResponse.json(
      {
        message: "נתונים לדוגמה נוצרו בהצלחה!",
        data: {
          stageTemplates: createdTemplates.length,
          categories: categories.length,
          customsCompanies: customsCompanies.length,
          customsAgents: customsAgents.length,
          suppliers: suppliers.length,
          orders: orders.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating seed data:", error);
    const errorMessage =
      error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json(
      {
        error: "שגיאה בשרת: " + errorMessage,
      },
      { status: 500 }
    );
  }
}
