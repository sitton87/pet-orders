import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type || !["suppliers", "orders", "categories"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid template type" },
        { status: 400 }
      );
    }

    const workbook = XLSX.utils.book_new();
    let worksheet: XLSX.WorkSheet;
    let filename = "template.xlsx";

    if (type === "suppliers") {
      const data = [
        [
          "Instructions: Fill data starting from row 4. Required: Supplier Name, Country",
        ],
        [
          "Supplier Name",
          "Country",
          "City",
          "Address",
          "Phone",
          "Email",
          "Contact Person",
          "Contact Phone",
          "Contact Position",
          "Production Time (weeks)",
          "Shipping Time (weeks)",
          "Advance Payment",
          "Advance Percentage",
          "Currency",
        ],
        [
          "EXAMPLE - DELETE ROW",
          "China",
          "Shanghai",
          "123 Street",
          "+86-21-1234567",
          "info@supplier.com",
          "John Doe",
          "+86-21-1234568",
          "Sales Manager",
          4,
          2,
          "Yes",
          30,
          "USD",
        ],
      ];
      worksheet = XLSX.utils.aoa_to_sheet(data);
      filename = "suppliers_template.xlsx";
    } else if (type === "orders") {
      const data = [
        [
          "Instructions: Fill data starting from row 4. Required: Order Number, Supplier Name",
        ],
        [
          "Order Number",
          "Supplier Name",
          "ETA Date",
          "Status",
          "Total Amount",
          "Advance Amount",
          "Final Payment",
          "Exchange Rate",
          "Container Number",
          "Notes",
          "Port Release Cost",
          "Original Currency",
        ],
        [
          "EXAMPLE - DELETE ROW",
          "Example Supplier",
          "2025-03-15",
          "PENDING",
          5500,
          1650,
          3850,
          3.8,
          "CONT123456",
          "Urgent",
          500,
          "USD",
        ],
      ];
      worksheet = XLSX.utils.aoa_to_sheet(data);
      filename = "orders_template.xlsx";
    } else if (type === "categories") {
      const data = [
        [
          "Instructions: Fill data starting from row 4. Required: Category Name",
        ],
        ["Category Name", "Description"],
        ["EXAMPLE - DELETE ROW", "Dog toys and accessories"],
      ];
      worksheet = XLSX.utils.aoa_to_sheet(data);
      filename = "categories_template.xlsx";
    }

    XLSX.utils.book_append_sheet(workbook, worksheet!, "Template");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Template creation error:", error);
    return NextResponse.json(
      { error: "Template creation failed" },
      { status: 500 }
    );
  }
}
