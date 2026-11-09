using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Grej.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddShipping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Hand-edited: the generated default was 0. The products that already exist get an
            // ordinary parcel (1 kg, 30 × 20 × 10 cm) instead, until the admin or reset-demo sets
            // their real size. The default stays in the database, since the deployed API's older
            // code does not send these columns when it creates a product.
            migrationBuilder.AddColumn<int>(
                name: "HeightCm",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 10);

            migrationBuilder.AddColumn<int>(
                name: "LengthCm",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 30);

            migrationBuilder.AddColumn<int>(
                name: "WeightGrams",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 1000);

            migrationBuilder.AddColumn<int>(
                name: "WidthCm",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 20);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingCost",
                table: "Orders",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShippingMethod",
                table: "Orders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HeightCm",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "LengthCm",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WeightGrams",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WidthCm",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ShippingCost",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ShippingMethod",
                table: "Orders");
        }
    }
}
