// app/api/suppliers-with-orders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("🔍 Fetching suppliers with active orders data...");

    const suppliersWithOrders = await prisma.supplier.findMany({
      where: {
        isActive: true, // רק ספקים פעילים
      },
      include: {
        // ספירת הזמנות פעילות
        _count: {
          select: {
            orders: {
              where: {
                status: {
                  notIn: ["הושלם", "מבוטלת"],
                },
              },
            },
          },
        },
        // הזמנות פעילות מפורטות
        orders: {
          where: {
            status: {
              notIn: ["הושלם", "מבוטלת"],
            },
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            originalCurrency: true,
            etaFinal: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        // קטגוריות ספק
        supplierCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // עיבוד הנתונים לפורמט נוח
    const processedSuppliers = suppliersWithOrders.map((supplier) => ({
      ...supplier,
      // הוסף מידע מעובד על הזמנות פעילות
      activeOrdersCount: supplier._count.orders,
      hasActiveOrders: supplier._count.orders > 0,
      activeOrders: supplier.orders, // כבר מסונן לפעילות בלבד
      // חישוב ערך כולל של הזמנות פעילות
      totalActiveOrdersValue: supplier.orders.reduce((sum, order) => {
        return sum + Number(order.totalAmount || 0);
      }, 0),
    }));

    console.log(`✅ Retrieved ${processedSuppliers.length} suppliers`);
    console.log(`📊 Active orders summary:`);

    const totalActiveOrders = processedSuppliers.reduce(
      (sum, s) => sum + s.activeOrdersCount,
      0
    );
    const suppliersWithActive = processedSuppliers.filter(
      (s) => s.hasActiveOrders
    ).length;

    console.log(`   - Total active orders: ${totalActiveOrders}`);
    console.log(
      `   - Suppliers with active orders: ${suppliersWithActive}/${processedSuppliers.length}`
    );

    return NextResponse.json({
      suppliers: processedSuppliers,
      meta: {
        totalSuppliers: processedSuppliers.length,
        totalActiveOrders,
        suppliersWithActiveOrders: suppliersWithActive,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching suppliers with orders:", error);
    return NextResponse.json(
      {
        error: "שגיאה בטעינת ספקים",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
